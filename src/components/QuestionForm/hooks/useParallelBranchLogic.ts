import { useMemo } from 'react';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';

interface UseParallelBranchLogicProps {
  allQuestions: Question[];
  currentQuestionId?: string;
  currentPageId?: string;
  parallelQuestions: string[];
}

export function useParallelBranchLogic({
  allQuestions,
  currentQuestionId,
  currentPageId,
  parallelQuestions,
}: UseParallelBranchLogicProps) {
  // Фильтруем вопросы, чтобы исключить текущий и другие параллельные группы
  const availableQuestions = useMemo(() => {
    return (allQuestions || []).filter(
      q =>
        q.pageId === currentPageId &&
        q.id !== currentQuestionId &&
        q.type !== QUESTION_TYPES.ParallelGroup &&
        q.type !== 'resolution', // TODO: использовать QUESTION_TYPES.Resolution
    );
  }, [allQuestions, currentQuestionId, currentPageId]);

  // Фильтруем доступные вопросы для выбора
  const availableForSelection = useMemo(() => 
    availableQuestions.filter(q => 
      q.type !== QUESTION_TYPES.ParallelGroup && 
      q.id !== currentQuestionId && 
      !parallelQuestions.includes(q.id)
    ),
    [availableQuestions, currentQuestionId, parallelQuestions]
  );

  return {
    availableQuestions,
    availableForSelection,
  };
} 