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
  // Хелперы для проверки ограничений вложенности
  const isInParallelGroup = (questionId: string): boolean => {
    return (allQuestions || []).some(
      (q) => q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(questionId)
    );
  };

  const hasNestedParallelChildren = (questionId: string): boolean => {
    const candidate = (allQuestions || []).find((q) => q.id === questionId);
    if (!candidate || !Array.isArray(candidate.parallelQuestions)) return false;
    const byId: Record<string, Question> = Object.fromEntries(
      (allQuestions || []).map((q) => [q.id, q])
    );
    return candidate.parallelQuestions.some((subId) => byId[subId]?.type === QUESTION_TYPES.ParallelGroup);
  };

  // Фильтруем вопросы, чтобы исключить текущий и вопросы с других страниц
  const availableQuestions = useMemo(() => {
    return (allQuestions || []).filter(
      q =>
        q.pageId === currentPageId &&
        q.id !== currentQuestionId &&
        q.type !== 'resolution', // TODO: использовать QUESTION_TYPES.Resolution
    );
  }, [allQuestions, currentQuestionId, currentPageId]);

  // Фильтруем доступные вопросы для выбора
  const availableForSelection = useMemo(() => 
    availableQuestions.filter(q => {
      if (q.id === currentQuestionId) return false; // сам себя нельзя
      if (parallelQuestions.includes(q.id)) return false; // уже добавлен

      // Для параллельных групп проверяем ограничения глубины и отсутствие циклов
      if (q.type === QUESTION_TYPES.ParallelGroup) {
        // Нельзя выбирать PG, которая уже вложена в другую PG (иначе глубина > 1)
        if (isInParallelGroup(q.id)) return false;
        // Нельзя выбирать PG, которая сама содержит PG (иначе глубина > 1)
        if (hasNestedParallelChildren(q.id)) return false;
        // Нельзя допустить цикл: кандидат не должен ссылаться на текущую группу
        if (Array.isArray(q.parallelQuestions) && q.parallelQuestions.includes(String(currentQuestionId))) {
          return false;
        }
      }

      return true;
    }),
    [availableQuestions, currentQuestionId, parallelQuestions]
  );

  return {
    availableQuestions,
    availableForSelection,
  };
} 