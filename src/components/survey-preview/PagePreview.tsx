import React, { useState } from 'react';
import { Question, QUESTION_TYPES, ParallelBranchSettings, TransitionRule } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceholderText } from '@/components/ui/placeholder-text';
import { ParallelGroupRenderer } from '@/components/survey-editor/ParallelGroupRenderer';

interface PagePreviewProps {
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  pages: { id: string; description: string }[];
  pageId: string;
  page?: { description: string };
}

export function PagePreview({ questions, answers, onAnswerChange, pages, pageId, page }: PagePreviewProps) {
  // ЛОГИРУЮ входные пропсы
  console.log('[PagePreview] questions:', questions);
  console.log('[PagePreview] answers:', answers);
  console.log('[PagePreview] pages:', pages);
  console.log('[PagePreview] pageId:', pageId);

  // Получаем индекс текущей страницы
  const pageIndex = pages.findIndex(p => p.id === pageId);
  // Собираем вопросы всех предыдущих и текущей страницы
  const prevQuestions = pages.slice(0, pageIndex + 1).flatMap(p => questions.filter(q => q.pageId === p.id));

  // ВАЖНОЕ ИСПРАВЛЕНИЕ: Фильтруем вопросы для страницы, исключая вложенные в параллельные группы
  const allParallelQuestionIds = new Set<string>();
  questions.forEach(q => {
    if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions) {
      q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
    }
  });

  const pageQuestions = questions.filter(q => 
    q.pageId === pageId && !allParallelQuestionIds.has(q.id)
  );

  console.log('[PagePreview] pageQuestions after filtering:', pageQuestions);
  console.log('[PagePreview] allParallelQuestionIds:', allParallelQuestionIds);

  // Проверяем, есть ли кастомные transitionRules (answer != '')
  const hasCustomRules = pageQuestions.some(q =>
    (q.transitionRules || []).some(r => r.answer && r.answer !== '')
  );

  // Если только дефолтные переходы — показываем все вопросы сразу
  if (!hasCustomRules) {
    // --- локальный state для repeatIndex параллельной ветки ---
    const [repeatIndexes, setRepeatIndexes] = React.useState<Record<string, number>>({});
    const handleRepeatIndex = (questionId: string, idx: number) => {
      setRepeatIndexes(prev => ({ ...prev, [questionId]: idx }));
    };
    
    return (
      <div className="space-y-6">
        {page?.description && (
          <div className="mb-4 text-muted-foreground">
            <PlaceholderText text={page.description} answers={answers} questions={questions} />
          </div>
        )}
        {pageQuestions.map((question) => (
          <div key={question.id} className="space-y-2">
            <div className="space-y-1">
              <Label className="text-base">
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {question.description && (
                <p className="text-sm text-gray-500">
                  <PlaceholderText text={question.description} answers={answers} questions={questions} />
                </p>
              )}
            </div>
            {question.type === QUESTION_TYPES.ParallelGroup ? (
              <ParallelGroupRenderer
                question={question}
                questions={questions}
                answers={answers}
                onAnswerChange={onAnswerChange}
                repeatIndexes={repeatIndexes}
                onRepeatIndexChange={handleRepeatIndex}
                mode="preview"
              />
            ) : (
              renderQuestion(question, questions, answers, onAnswerChange)
            )}
          </div>
        ))}
      </div>
    );
  }

  // Если есть кастомные transitionRules — пошаговый режим (старое поведение)
  const [currentQuestionId, setCurrentQuestionId] = React.useState<string | null>(() => {
    // Находим стартовый вопрос (без входящих transitionRules)
    const allNextIds = new Set(
      pageQuestions.flatMap(q => q.transitionRules?.map(r => r.nextQuestionId) || [])
    );
    const start = pageQuestions.find(q => !allNextIds.has(q.id));
    return start ? start.id : pageQuestions[0]?.id || null;
  });

  const currentQuestion = pageQuestions.find(q => q.id === currentQuestionId);

  function handleAnswer(questionId: string, value: any) {
    const q = pageQuestions.find(q => q.id === questionId);
    let validValue = value;
    if (q && (q.type === QUESTION_TYPES.Radio || q.type === QUESTION_TYPES.Select)) {
      // Если value не найден среди options — не сохраняем
      if (!q.options?.some(opt => opt.id === value)) {
        console.warn('[handleAnswer] Некорректный value для Radio/Select:', value, 'Ожидались:', q.options?.map(o => o.id));
        return;
      }
    }
    onAnswerChange(questionId, validValue);
    // Переход к следующему вопросу по transitionRules
    if (!q || !q.transitionRules || q.transitionRules.length === 0) return;
    let nextId: string | undefined;
    // Для Radio/Select ищем по значению ответа
    if (q.type === QUESTION_TYPES.Radio || q.type === QUESTION_TYPES.Select) {
      const rule = q.transitionRules.find(r => r.answer === value);
      nextId = rule?.nextQuestionId;
    } else {
      // Для остальных — берём первое правило (или расширить по необходимости)
      nextId = q.transitionRules[0]?.nextQuestionId;
    }
    if (nextId) setCurrentQuestionId(nextId);
  }

  if (!currentQuestion) return <div>Вопросы не найдены</div>;

  return (
    <div className="space-y-6">
      {page?.description && (
        <div className="mb-4 text-muted-foreground">
          <PlaceholderText text={page.description} answers={answers} questions={questions} />
        </div>
      )}
      <div key={currentQuestion.id} className="space-y-2">
        <div className="space-y-1">
          <Label className="text-base">
            {currentQuestion.title}
            {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {currentQuestion.description && (
            <p className="text-sm text-gray-500">
              <PlaceholderText text={currentQuestion.description} answers={answers} questions={questions} />
            </p>
          )}
        </div>
        {currentQuestion.type === QUESTION_TYPES.ParallelGroup ? (
          <ParallelGroupRenderer
            question={currentQuestion}
            questions={questions}
            answers={answers}
            onAnswerChange={onAnswerChange}
            mode="preview"
          />
        ) : (
          renderQuestion(currentQuestion, questions, answers, handleAnswer)
        )}
      </div>
    </div>
  );
}

// Функция для рендеринга обычных вопросов (не параллельных групп)
function renderQuestion(
  question: Question,
  questions: Question[],
  answers: Record<string, any>,
  answerHandler: (id: string, value: any) => void
) {
  // Получаем ответ для текущего вопроса
  const currentAnswer = answers[question.id];

  switch (question.type) {
    case QUESTION_TYPES.ParallelGroup: {
      // Этот случай не должен вызываться, так как ParallelGroup обрабатывается отдельно
      console.warn('[renderQuestion] ParallelGroup должен обрабатываться в ParallelGroupRenderer');
      return null;
    }

    case QUESTION_TYPES.Text:
      return (
        <Input
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите ваш ответ"
        />
      );

    case QUESTION_TYPES.Number:
      return (
        <Input
          type="number"
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите число"
        />
      );

    case QUESTION_TYPES.Radio:
      return (
        <RadioGroup
          value={currentAnswer || ''}
          onValueChange={(value) => answerHandler(question.id, value)}
        >
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      );

    case QUESTION_TYPES.Checkbox:
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={currentAnswer?.includes(option.id) || false}
                onCheckedChange={(checked) => {
                  const currentAnswers = currentAnswer || [];
                  answerHandler(
                    question.id,
                    checked
                      ? [...currentAnswers, option.id]
                      : currentAnswers.filter((id: string) => id !== option.id)
                  );
                }}
              />
              <Label htmlFor={option.id}>{option.text}</Label>
            </div>
          ))}
        </div>
      );

    case QUESTION_TYPES.Select:
      return (
        <Select
          value={currentAnswer || ''}
          onValueChange={(value) => answerHandler(question.id, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите вариант" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case QUESTION_TYPES.Date:
      const dateSettings = question.settings as { format?: string };
      return (
        <div className="space-y-2">
          <Calendar
            mode="single"
            selected={currentAnswer}
            onSelect={(value) => answerHandler(question.id, value)}
            className="rounded-md border"
          />
          {currentAnswer && (
            <p className="text-sm text-gray-500">
              Выбрано: {format(currentAnswer, dateSettings?.format || 'dd.MM.yyyy')}
            </p>
          )}
        </div>
      );

    case QUESTION_TYPES.Email:
      return (
        <Input
          type="email"
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="example@domain.com"
        />
      );

    case QUESTION_TYPES.Phone:
      const phoneSettings = question.settings as { countryCode?: string; mask?: string };
      return (
        <div className="flex gap-2">
          <Input
            className="w-20"
            value={phoneSettings?.countryCode || '+7'}
            disabled
          />
          <IMaskInput
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            mask={phoneSettings?.mask || '(000) 000-00-00'}
            value={currentAnswer || ''}
            onAccept={(value) => answerHandler(question.id, value)}
            placeholder="(999) 999-99-99"
          />
        </div>
      );

    default:
      return null;
  }
}