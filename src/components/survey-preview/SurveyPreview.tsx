import React, { useState, useMemo } from 'react';
import {
  Survey,
  SurveyVersion,
  Question,
  Page,
  QUESTION_TYPES,
  FileUploadAnswer,
} from '@survey-platform/shared-types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PagePreview } from './PagePreview';

interface SurveyPreviewProps {
  questions: Question[];
  pages: { id: string; title: string; description?: string }[];
  onClose: () => void;
  surveyId?: string;
}

export function SurveyPreview({ questions, pages, onClose, surveyId }: SurveyPreviewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const questionsByPage = useMemo(() => {
    const grouped: Record<string, Question[]> = {};
    pages.forEach(page => {
      grouped[page.id] = questions.filter(q => q.pageId === page.id);
    });
    return grouped;
  }, [questions, pages]);

  const currentPage = pages[currentPageIndex];
  const currentQuestions = questionsByPage[currentPage.id] || [];
  const isLastPage = currentPageIndex === pages.length - 1;
  const isFirstPage = currentPageIndex === 0;

  // === DEBUG LOGS ===
  console.log('[SurveyPreview] pages:', pages);
  console.log('[SurveyPreview] questions:', questions);
  console.log('[SurveyPreview] currentPageIndex:', currentPageIndex);
  console.log('[SurveyPreview] currentPage:', currentPage);
  console.log('[SurveyPreview] questionsByPage:', questionsByPage);
  // === END DEBUG LOGS ===

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Улучшенная валидация с поддержкой параллельных групп
  const isAnswerValid = (question: Question, answer: any): boolean => {
    if (!question.required) return true;
    if (!answer) return false;

    switch (question.type) {
      case QUESTION_TYPES.ParallelGroup: {
        const countKey = question.id + '_count';
        const parentCount = Number(answers[countKey]) || 0;
        if (parentCount <= 0) return false;

        // Валидация под-уровня: если среди под-вопросов есть PG — валидируем её с учётом общего child.count
        for (const subId of question.parallelQuestions || []) {
          const subQ = questions.find(q => q.id === subId);
          if (!subQ) continue;

          if (subQ.type === QUESTION_TYPES.ParallelGroup) {
            // Общий child.count
            const childCountKey = `${subQ.id}_count`;
            const childCount = Number(answers[childCountKey]) || 0;
            if (subQ.required && childCount <= 0) return false;
            // Для каждого повтора родителя проверяем каждый повтор дочерней PG
            for (let i = 0; i < parentCount; i++) {
              for (const grandId of subQ.parallelQuestions || []) {
                const grandQ = questions.find(q => q.id === grandId);
                if (grandQ?.required) {
                  for (let j = 0; j < childCount; j++) {
                    const key = `${grandId}_${j}`;
                    const val = answers[key];
                    if (!isAnswerValid(grandQ, val)) {
                      return false;
                    }
                  }
                }
              }
            }
          } else if (subQ.required) {
            // Обычные под-вопросы родителя: проверяем все итерации
            for (let i = 0; i < parentCount; i++) {
              const subKey = `${subQ.id}_${i}`;
              const subVal = answers[subKey];
              if (!isAnswerValid(subQ, subVal)) {
                return false;
              }
            }
          }
        }
        return true;
      }
      case QUESTION_TYPES.Checkbox:
        return Array.isArray(answer) && answer.length > 0;
      case QUESTION_TYPES.Radio:
      case QUESTION_TYPES.Select:
        return answer !== '';
      case QUESTION_TYPES.FileUpload:
        const fileAnswer = answer as FileUploadAnswer;
        return fileAnswer && fileAnswer.files && fileAnswer.files.length > 0;
      default:
        return !!answer;
    }
  };

  const validateCurrentPage = () => {
    // Фильтруем вопросы так же, как в PagePreview
    const allParallelQuestionIds = new Set<string>();
    questions.forEach(q => {
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions) {
        q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
      }
    });

    const pageQuestions = currentQuestions.filter(q => !allParallelQuestionIds.has(q.id));

    const invalidQuestions = pageQuestions.filter(
      question => question.required && !isAnswerValid(question, answers[question.id])
    );

    if (invalidQuestions.length > 0) {
      toast.error('Пожалуйста, ответьте на все обязательные вопросы');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentPage()) return;
    setCurrentPageIndex(prev => {
      const next = prev + 1;
      // DEBUG LOG
      setTimeout(() => {
        console.log('[SurveyPreview] handleNext: currentPageIndex ->', next);
        console.log('[SurveyPreview] currentPage:', pages[next]);
        console.log('[SurveyPreview] questionsByPage:', questionsByPage);
      }, 0);
      return next;
    });
  };

  const handlePrevious = () => {
    setCurrentPageIndex(prev => {
      const next = prev - 1;
      // DEBUG LOG
      setTimeout(() => {
        console.log('[SurveyPreview] handlePrevious: currentPageIndex ->', next);
        console.log('[SurveyPreview] currentPage:', pages[next]);
        console.log('[SurveyPreview] questionsByPage:', questionsByPage);
      }, 0);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!validateCurrentPage()) return;
    
    // В реальном приложении здесь бы отправляли данные на сервер
    console.log('[SurveyPreview] Submitting answers:', answers);
    onClose();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{currentPage.title}</h2>
      </div>

      <PagePreview
        questions={questions}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        pages={pages.map(p => ({ id: p.id, description: p.description || '' }))}
        pageId={currentPage.id}
        page={{ description: currentPage.description }}
        surveyId={surveyId}
      />

      <div className="flex items-center justify-between mt-4 relative">
        {!isFirstPage && (
          <Button onClick={handlePrevious} variant="outline">
            Назад
          </Button>
        )}
        <div className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-500">
          Страница {currentPageIndex + 1} из {pages.length}
        </div>
        {isLastPage ? (
          <Button onClick={handleSubmit} className="ml-auto">
            Завершить
          </Button>
        ) : (
          <Button onClick={handleNext} className="ml-auto">
            Далее
          </Button>
        )}
      </div>
    </div>
  );
}