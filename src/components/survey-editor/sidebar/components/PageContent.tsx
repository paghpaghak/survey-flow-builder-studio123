import React from 'react';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableQuestionNode } from '../nodes/SortableQuestionNode';
import { SortableParallelGroupNode } from '../nodes/SortableParallelGroupNode';

interface PageContentProps {
  pageQuestions: Question[];
  isPageExpanded: boolean;
  questions: Question[];
  selectedQuestionId?: string;
  onSelectQuestion: (questionId: string | undefined) => void;
  onUpdateQuestionTitle?: (questionId: string, newTitle: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (id: string | null) => void;
  editingQuestionTitle: string;
  setEditingQuestionTitle: (title: string) => void;
  expandedGroups: Record<string, boolean>;
  setExpandedGroups: (groups: Record<string, boolean> | ((g: Record<string, boolean>) => Record<string, boolean>)) => void;
  setConfirmDeleteParallelId: (id: string | null) => void;
}

export function PageContent({
  pageQuestions,
  isPageExpanded,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onUpdateQuestionTitle,
  onDeleteQuestion,
  editingQuestionId,
  setEditingQuestionId,
  editingQuestionTitle,
  setEditingQuestionTitle,
  expandedGroups,
  setExpandedGroups,
  setConfirmDeleteParallelId,
}: PageContentProps) {
  if (!isPageExpanded) return null;

  if (pageQuestions.length === 0) {
    return (
      <div className="px-4 py-2">
        <div className="text-gray-400 italic text-sm">Нет вопросов</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <SortableContext items={pageQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {pageQuestions.map((q, idx) => {
            if (q.type === QUESTION_TYPES.ParallelGroup) {
              const isExpanded = expandedGroups[q.id] || false;
              return (
                <SortableParallelGroupNode
                  key={q.id}
                  q={q}
                  idx={idx}
                  isSelected={q.id === selectedQuestionId}
                  isExpanded={isExpanded}
                  onSelect={() => onSelectQuestion(q.id)}
                  onToggleExpand={() => setExpandedGroups(e => ({ ...e, [q.id]: !e[q.id] }))}
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
                />
              );
            }
            return (
              <SortableQuestionNode
                key={q.id}
                node={{ data: { ...q, type: 'question', title: q.title || 'Без названия' } }}
                style={{}}
                isSelected={q.id === selectedQuestionId}
                onSelect={() => onSelectQuestion(q.id)}
                onUpdateTitle={newTitle => onUpdateQuestionTitle?.(q.id, newTitle)}
                onDelete={onDeleteQuestion ? () => onDeleteQuestion(q.id) : undefined}
                editing={editingQuestionId === q.id}
                setEditing={v => {
                  setEditingQuestionId(v ? q.id : null);
                  setEditingQuestionTitle(q.title || '');
                }}
                editingTitle={editingQuestionId === q.id ? editingQuestionTitle : undefined}
                setEditingTitle={setEditingQuestionTitle}
                number={idx + 1}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
} 