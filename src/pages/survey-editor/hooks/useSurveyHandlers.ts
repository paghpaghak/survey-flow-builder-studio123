import { useCallback } from 'react';
import type { Page, Question, Survey } from '@survey-platform/shared-types';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import { toast } from 'sonner';

interface UseSurveyHandlersProps {
  survey: Survey;
  currentVersion: any;
  questions: Question[];
  pages: Page[];
  updateSurvey: (survey: Survey) => void;
  setSelectedQuestionId: (id: string | undefined) => void;
}

export function useSurveyHandlers({ survey, currentVersion, questions, pages, updateSurvey, setSelectedQuestionId }: UseSurveyHandlersProps) {
  // Удаление вопроса
  const handleDeleteQuestion = useCallback((qid: string) => {
    const questionToDelete = questions.find(q => q.id === qid);
    let questionsToDelete = [qid];
    if (questionToDelete?.type === QUESTION_TYPES.ParallelGroup && questionToDelete.parallelQuestions) {
      questionsToDelete = [...questionsToDelete, ...questionToDelete.parallelQuestions];
    }
    const updatedQuestions = questions.filter(q => !questionsToDelete.includes(q.id));
    const cleanedQuestions = updatedQuestions.map(q => ({
      ...q,
      transitionRules: q.transitionRules?.filter(rule => !questionsToDelete.includes(rule.nextQuestionId))
    }));
    updateSurvey({
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion
          ? { ...v, questions: cleanedQuestions }
          : v
      )
    });
    if (questionsToDelete.includes(setSelectedQuestionId ? setSelectedQuestionId.toString() : '')) {
      setSelectedQuestionId(undefined);
    }
  }, [questions, survey, updateSurvey, setSelectedQuestionId]);

  // Обновление вопросов
  const handleUpdateQuestions = useCallback((updatedQuestions: Question[]) => {
    const otherQuestions = questions.filter(q => !updatedQuestions.some(uq => uq.id === q.id));
    const allQuestions = [...otherQuestions, ...updatedQuestions];
    const updatedPages = currentVersion.pages.map((page: Page) => ({
      ...page,
      questions: allQuestions.filter(q => q.pageId === page.id)
    }));
    const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());
    const updatedVersion = {
      ...currentVersion,
      questions: uniqueQuestions,
      pages: updatedPages,
      updatedAt: new Date().toISOString()
    };
    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map((v: any) =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date().toISOString()
    };
    updateSurvey(updatedSurvey);
  }, [questions, currentVersion, survey, updateSurvey]);

  // Обновление страниц
  const handleUpdatePages = useCallback((updatedPages: Page[]) => {
    if (updatedPages.length === 0) {
      toast.error('Должна быть хотя бы одна страница');
      return;
    }
    const updatedVersion = {
      ...currentVersion,
      pages: updatedPages,
      updatedAt: new Date().toISOString()
    };
    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map((v: any) =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date().toISOString()
    };
    updateSurvey(updatedSurvey);
  }, [currentVersion, survey, updateSurvey]);

  // Другие обработчики можно вынести аналогично...

  return {
    handleDeleteQuestion,
    handleUpdateQuestions,
    handleUpdatePages,
    // ...добавить остальные обработчики по мере необходимости
  };
} 