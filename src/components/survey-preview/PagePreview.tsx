import React from 'react';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';
import { Label } from '@/components/ui/label';
import { PlaceholderText } from '@/components/ui/placeholder-text';
import { ParallelGroupRenderer } from '@/components/survey-editor/ParallelGroupRenderer';
import { renderQuestion } from '@/components/survey-editor/utils/questionRenderer';

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