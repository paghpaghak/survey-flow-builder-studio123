import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { useSidebarState } from './useSidebarState';
import { useQuestionDragAndDrop } from './useQuestionDragAndDrop';
import type { Question } from '@survey-platform/shared-types';

interface UseSidebarTreeLogicProps {
  questions: Question[];
  onQuestionOrderChange?: (questions: Question[]) => void;
}

export function useSidebarTreeLogic({
  questions,
  onQuestionOrderChange,
}: UseSidebarTreeLogicProps) {
  const sidebarState = useSidebarState();
  
  const { handleDragEnd } = useQuestionDragAndDrop({
    questions,
    setActiveId: sidebarState.setActiveId,
    onQuestionOrderChange,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return {
    ...sidebarState,
    handleDragEnd,
    sensors,
  };
} 