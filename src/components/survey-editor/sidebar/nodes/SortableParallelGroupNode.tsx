import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { GripVertical, Trash, ChevronDown, ChevronRight } from 'lucide-react';
import { Question } from '@survey-platform/shared-types';
import { RenderParallelBranch } from './RenderParallelBranch';

function getTransformStyle(transform: any) {
  if (!transform) return undefined;
  const { x = 0, y = 0, scaleX = 1, scaleY = 1 } = transform;
  return `translate3d(${x}px, ${y}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`;
}

export function SortableParallelGroupNode({
  q,
  idx,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
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
}: {
  q: Question;
  idx: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
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
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: q.id });

  const styleWithTransform = {
    ...(transform != null ? { transform: getTransformStyle(transform) } : {}),
    ...(typeof transition === 'string' ? { transition } : {}),
  };

  return (
    <div ref={setNodeRef} style={styleWithTransform}>
      <div
        className={cn(
          'transition-all cursor-pointer select-none w-full group',
          'px-2 py-1 rounded text-sm flex items-center gap-2 bg-gray-50 border-l-4 pl-2',
          'border-b border-gray-200 mb-1',
          isSelected ? 'border-primary bg-primary/10 shadow border-l-blue-400' : 'hover:border-primary/30 border-l-blue-100',
        )}
        onClick={onSelect}
      >
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing w-4 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-muted-foreground mr-1 w-4 text-right select-none">{idx + 1}.</span>
        <span className="truncate flex-1 font-medium" title={q.title}>{q.title}</span>
        <button
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-600 flex-shrink-0"
          title="Удалить ветку"
          onClick={e => {
            e.stopPropagation();
            setConfirmDeleteParallelId(q.id);
          }}
        >
          <Trash className="w-4 h-4" />
        </button>
        <span
          className="ml-2 flex-shrink-0"
          onClick={e => {
            e.stopPropagation();
            onToggleExpand();
          }}
          title={isExpanded ? 'Скрыть вложенные вопросы' : 'Показать вложенные вопросы'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </span>
      </div>
      {isExpanded && (
        <div className="ml-7 mt-1 space-y-1">
          <RenderParallelBranch
            q={q}
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
        </div>
      )}
    </div>
  );
} 