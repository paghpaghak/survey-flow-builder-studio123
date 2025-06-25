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
      case QUESTION_TYPES.ParallelGroup:
        // Для параллельной группы проверяем наличие ответа на количество
        const countKey = question.id + '_count';
        const count = Number(answers[countKey]) || 0;
        if (count <= 0) return false;
        
        // Проверяем ответы на все вложенные обязательные вопросы
        if (question.parallelQuestions) {
          for (const subQuestionId of question.parallelQuestions) {
            const subQuestion = questions.find(q => q.id === subQuestionId);
            if (subQuestion?.required) {
              // Проверяем ответы для всех повторений
              for (let i = 0; i < count; i++) {
                const subAnswerKey = `${subQuestionId}_${i}`;
                const subAnswer = answers[subAnswerKey];
                if (!isAnswerValid(subQuestion, subAnswer)) {
                  return false;
                }
              }
            }
          }
        }
        return true;
      case QUESTION_TYPES.Email:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer);
      case QUESTION_TYPES.Phone:
        return answer.replace(/\D/g, '').length >= 10;
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