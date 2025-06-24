import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { SortableQuestionNode } from '../nodes/SortableQuestionNode';
import type { Question } from '@survey-platform/shared-types';

interface TreeDragOverlayProps {
  activeId: string | null;
  questions: Question[];
}

export function TreeDragOverlay({ activeId, questions }: TreeDragOverlayProps) {
  const activeQuestion = activeId ? questions.find(q => q.id === activeId) : null;

  return (
    <DragOverlay>
      {activeQuestion ? (
        <SortableQuestionNode
          node={{
            data: {
              ...activeQuestion,
              type: 'question',
              title: activeQuestion.title || 'Без названия',
            },
          }}
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)', background: 'white' }}
          isSelected={false}
          onSelect={() => {}}
        />
      ) : null}
    </DragOverlay>
  );
} 