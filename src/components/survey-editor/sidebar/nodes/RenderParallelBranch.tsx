import React from 'react';
import { QUESTION_TYPES, Question } from '@survey-platform/shared-types';
import { SortableQuestionNode } from './SortableQuestionNode';

export function RenderParallelBranch({
  q,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onUpdateQuestionTitle,
  onDeleteQuestion,
  editingQuestionId,
  setEditingQuestionId,
  editingQuestionTitle,
  setEditingQuestionTitle,
  setConfirmDeleteParallelId,
  level = 1,
}: {
  q: Question;
  questions: Question[];
  selectedQuestionId?: string;
  onSelectQuestion?: (id: string) => void;
  onUpdateQuestionTitle?: (id: string, newTitle: string) => void;
  onDeleteQuestion?: (id: string) => void;
  editingQuestionId?: string | null;
  setEditingQuestionId?: (id: string | null) => void;
  editingQuestionTitle?: string;
  setEditingQuestionTitle?: (title: string) => void;
  setConfirmDeleteParallelId: (id: string | null) => void;
  level?: number;
}) {
  return (
    <div style={{ marginLeft: level * 16 }}>
      <div className="mt-1 space-y-1">
        {(q.parallelQuestions || []).map((subId, i) => {
          const subQ = questions.find(qq => qq.id === subId);
          if (!subQ) return null;
          if (subQ.type === QUESTION_TYPES.ParallelGroup) {
            return (
              <RenderParallelBranch
                key={subQ.id}
                q={subQ}
                questions={questions}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={onSelectQuestion}
                onUpdateQuestionTitle={onUpdateQuestionTitle}
                onDeleteQuestion={onDeleteQuestion}
                editingQuestionId={editingQuestionId}
                setEditingQuestionId={setEditingQuestionId}
                editingQuestionTitle={editingQuestionTitle}
                setEditingQuestionTitle={setEditingQuestionTitle}
                setConfirmDeleteParallelId={setConfirmDeleteParallelId}
                level={level + 1}
              />
            );
          }
          return (
            <SortableQuestionNode
              key={subQ.id}
              node={{ data: { ...subQ, type: 'question', title: subQ.title || 'Без названия' } }}
              style={{}}
              isSelected={subQ.id === selectedQuestionId}
              onSelect={() => onSelectQuestion && onSelectQuestion(subQ.id)}
              onUpdateTitle={newTitle => onUpdateQuestionTitle?.(subQ.id, newTitle)}
              onDelete={onDeleteQuestion ? () => onDeleteQuestion(subQ.id) : undefined}
              editing={editingQuestionId === subQ.id}
              setEditing={v => {
                setEditingQuestionId && setEditingQuestionId(v ? subQ.id : null);
                setEditingQuestionTitle && setEditingQuestionTitle(subQ.title || '');
              }}
              editingTitle={editingQuestionId === subQ.id ? editingQuestionTitle : undefined}
              setEditingTitle={setEditingQuestionTitle}
              number={i + 1}
              nested
            />
          );
        })}
      </div>
    </div>
  );
} 