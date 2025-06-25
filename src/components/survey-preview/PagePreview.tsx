import React from 'react';
import { Question, QUESTION_TYPES, TextSettings } from '@survey-platform/shared-types';
import { Label } from '@/components/ui/label';
import { PlaceholderText } from '@/components/ui/placeholder-text';
import { ParallelGroupRenderer } from '@/components/survey-editor/ParallelGroupRenderer';
import { renderQuestion } from '@/components/survey-editor/utils/questionRenderer';
import { ConditionalLogicEngine } from '@/lib/conditional-logic-engine';
import { getQuestionsRealOrder, hasCustomTransitionRules, findStartQuestion } from '@/utils/questionUtils';

interface PagePreviewProps {
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  pages: { id: string; description: string }[];
  pageId: string;
  page?: { description: string };
  surveyId?: string;
}

export function PagePreview({ questions, answers, onAnswerChange, pages, pageId, page, surveyId }: PagePreviewProps) {
  // Функция для проверки нужно ли скрывать заголовок вопроса
  const shouldHideTitle = (question: Question) => {
    if (question.type === QUESTION_TYPES.Text) {
      const textSettings = question.settings as TextSettings | undefined;
      return textSettings?.showTitleInside === true;
    }
    return false;
  };

  // Получаем индекс текущей страницы
  const pageIndex = pages.findIndex(p => p.id === pageId);
  // Собираем вопросы всех предыдущих и текущей страницы
  const prevQuestions = pages.slice(0, pageIndex + 1).flatMap(p => questions.filter(q => q.pageId === p.id));

  // РЕАЛЬНЫЙ ПОРЯДОК: Определяем порядок вопросов на основе позиции в визуальном редакторе
  const pageQuestions = getQuestionsRealOrder(questions, pageId);

  // Фильтруем видимые вопросы согласно условной логике
  // ВАЖНО: передаем ВСЕ вопросы опроса для корректной работы условий между страницами
  const visibleQuestions = ConditionalLogicEngine.getVisibleQuestions(
    pageQuestions, 
    answers, 
    questions // передаем все вопросы, а не только prevQuestions
  );

  // Проверяем, есть ли кастомные transitionRules среди видимых вопросов
  const hasCustomRules = hasCustomTransitionRules(visibleQuestions);

  // Если только дефолтные переходы — показываем все вопросы сразу
  if (!hasCustomRules) {
    // --- локальный state для repeatIndex параллельной ветки ---
    const [repeatIndexes, setRepeatIndexes] = React.useState<Record<string, number>>({});
    const handleRepeatIndex = (questionId: string, idx: number) => {
      setRepeatIndexes(prev => ({ ...prev, [questionId]: idx }));
    };
    
    return (
      <div className="space-y-6">
        {page?.description && page.description.trim() && (
          <div className="mb-4 text-muted-foreground">
            <PlaceholderText text={page.description} answers={answers} questions={questions} />
          </div>
        )}
        {visibleQuestions.map((question) => (
          <div key={question.id} className="space-y-2">
            <div className="space-y-1">
              {!shouldHideTitle(question) && (
                <Label className="text-base">
                  {question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              )}
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
                surveyId={surveyId}
              />
            ) : (
              renderQuestion(question, questions, answers, onAnswerChange, undefined, surveyId)
            )}
          </div>
        ))}
      </div>
    );
  }

  // Если есть кастомные transitionRules — пошаговый режим
  const [currentQuestionId, setCurrentQuestionId] = React.useState<string | null>(() => {
    // Находим стартовый вопрос среди видимых
    const startQuestion = findStartQuestion(visibleQuestions);
    return startQuestion?.id || null;
  });

  const currentQuestion = visibleQuestions.find(q => q.id === currentQuestionId);

  function handleAnswer(questionId: string, value: any) {
    const q = visibleQuestions.find(q => q.id === questionId);
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
      {page?.description && page.description.trim() && (
        <div className="mb-4 text-muted-foreground">
          <PlaceholderText text={page.description} answers={answers} questions={questions} />
        </div>
      )}
      <div key={currentQuestion.id} className="space-y-2">
        <div className="space-y-1">
          {!shouldHideTitle(currentQuestion) && (
            <Label className="text-base">
              {currentQuestion.title}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
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
            surveyId={surveyId}
          />
        ) : (
          renderQuestion(currentQuestion, questions, answers, handleAnswer, undefined, surveyId)
        )}
      </div>
    </div>
  );
}