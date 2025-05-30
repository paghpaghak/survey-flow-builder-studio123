import React, { useState, useMemo } from 'react';
import { Question, QuestionType } from '@/types/survey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { format } from 'date-fns';
import { PagePreview } from './PagePreview';

interface SurveyPreviewProps {
  questions: Question[];
  pages: { id: string; title: string }[];
  onClose: () => void;
}

export function SurveyPreview({ questions, pages, onClose }: SurveyPreviewProps) {
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

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isAnswerValid = (question: Question, answer: any): boolean => {
    if (!question.required) return true;
    if (!answer) return false;

    switch (question.type) {
      case QuestionType.Email:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer);
      case QuestionType.Phone:
        return answer.replace(/\D/g, '').length >= 10;
      case QuestionType.Checkbox:
        return Array.isArray(answer) && answer.length > 0;
      case QuestionType.Radio:
      case QuestionType.Select:
        return answer !== '';
      default:
        return !!answer;
    }
  };

  const validateCurrentPage = () => {
    const invalidQuestions = currentQuestions.filter(
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
    setCurrentPageIndex(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentPageIndex(prev => prev - 1);
  };

  const handleSubmit = () => {
    if (!validateCurrentPage()) return;
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
        pages={pages}
        pageId={currentPage.id}
        page={currentPage}
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