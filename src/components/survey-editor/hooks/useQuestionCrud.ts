import { useState, useCallback } from 'react';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';

interface UseQuestionCrudProps {
  allQuestions: Question[];
  onUpdateQuestions?: (questions: Question[]) => void;
}

export function useQuestionCrud({ allQuestions, onUpdateQuestions }: UseQuestionCrudProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteQuestion = useCallback(
    (id: string) => {
      const questionToDelete = allQuestions.find(q => q.id === id);
      let questionsToDelete = [id];

      // Если удаляется параллельная группа, добавляем все вложенные вопросы
      if (questionToDelete?.type === QUESTION_TYPES.ParallelGroup && questionToDelete.parallelQuestions) {
        questionsToDelete = [...questionsToDelete, ...questionToDelete.parallelQuestions];
      }

      // Удаляем все связанные вопросы из allQuestions
      const updatedAllQuestions = allQuestions.filter(q => !questionsToDelete.includes(q.id));

      // Также удаляем все transitionRules, которые ссылаются на удаляемые вопросы
      const cleanedQuestions = updatedAllQuestions.map(q => ({
        ...q,
        transitionRules: q.transitionRules?.filter(rule => !questionsToDelete.includes(rule.nextQuestionId)),
      }));

      onUpdateQuestions?.(cleanedQuestions);
    },
    [allQuestions, onUpdateQuestions]
  );

  const handleEditQuestion = useCallback(
    (updatedQuestion: Question) => {
      const exists = allQuestions.some(q => q.id === updatedQuestion.id);
      let updatedQuestions: Question[];
      if (exists) {
        updatedQuestions = allQuestions.map(q =>
          q.id === updatedQuestion.id ? { ...updatedQuestion, position: q.position || updatedQuestion.position } : q
        );
      } else {
        updatedQuestions = [...allQuestions, updatedQuestion];
      }
      onUpdateQuestions?.(updatedQuestions);
    },
    [allQuestions, onUpdateQuestions]
  );

  const openEditDialog = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    setSelectedQuestion(null);
    setIsDialogOpen(false);
  }, []);

  return {
    selectedQuestion,
    isDialogOpen,
    handleDeleteQuestion,
    handleEditQuestion,
    openEditDialog,
    closeEditDialog,
  };
} 