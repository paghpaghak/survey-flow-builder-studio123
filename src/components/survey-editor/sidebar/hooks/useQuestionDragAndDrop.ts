import { DragEndEvent } from '@dnd-kit/core';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';

interface useQuestionDragAndDropProps {
  questions: Question[];
  setActiveId: (id: string | null) => void;
  onQuestionOrderChange?: (questions: Question[]) => void;
}

export function useQuestionDragAndDrop({
  questions,
  setActiveId,
  onQuestionOrderChange,
}: useQuestionDragAndDropProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeQuestion = questions.find(q => q.id === active.id);
    const overQuestion = questions.find(q => q.id === over.id);

    // --- Ограничения для параллельных веток ---
    // 1. Запрет перемещения вопроса внутрь/вне ветки
    const isActiveInParallel = questions.some(
      q => q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(active.id))
    );
    const isOverInParallel = questions.some(
      q => q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(over.id))
    );
    // 2. Запрет перемещения между разными ветками
    let activeParallelId = null;
    let overParallelId = null;
    for (const q of questions) {
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(active.id)))
        activeParallelId = q.id;
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(over.id)))
        overParallelId = q.id;
    }
    if (
      isActiveInParallel !== isOverInParallel ||
      (activeParallelId && overParallelId && activeParallelId !== overParallelId)
    ) {
      window.alert('Перемещение вопросов внутрь/вне параллельной ветки или между ветками запрещено.');
      return;
    }

    if (!activeQuestion || !overQuestion || activeQuestion.pageId !== overQuestion.pageId) return;

    const oldIndex = questions.findIndex(q => q.id === active.id);
    const newIndex = questions.findIndex(q => q.id === over.id);

    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(oldIndex, 1);
    newQuestions.splice(newIndex, 0, removed);

    onQuestionOrderChange?.(newQuestions);
  };

  return { handleDragEnd };
} 