import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical, Trash } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

// Эта вспомогательная функция также находилась в SidebarTreeView.tsx
function getTransformStyle(transform: any) {
  if (!transform) return undefined;
  const { x = 0, y = 0, scaleX = 1, scaleY = 1 } = transform;
  return `translate3d(${x}px, ${y}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`;
}

export function SortableQuestionNode({ node, style, isSelected, onSelect, onUpdateTitle, onDelete, editing, setEditing, editingTitle, setEditingTitle, number, nested }: {
  node: any;
  style: React.CSSProperties;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateTitle?: (newTitle: string) => void;
  onDelete?: () => void;
  editing?: boolean;
  setEditing?: (v: boolean) => void;
  editingTitle?: string;
  setEditingTitle?: (v: string) => void;
  number?: number;
  nested?: boolean;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  if (!node?.data) return null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: node.data.id });

  const styleWithTransform = {
    ...(style ?? {}),
    ...(transform != null ? { transform: getTransformStyle(transform) } : {}),
    ...(typeof transition === 'string' ? { transition } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={styleWithTransform}
      onClick={onSelect}
      className={cn(
        'transition-all cursor-pointer select-none w-full group',
        'px-2 py-1 rounded text-sm flex items-center gap-0',
        'border-b border-gray-200 mb-1',
        isSelected
          ? 'border-primary bg-primary/10 shadow border-l-blue-400'
          : 'hover:border-primary/30 border-l-blue-100',
        nested ? 'pl-3 border-l-2 border-dashed border-gray-300 bg-gray-50' : 'bg-gray-50',
      )}
    >
      <div
        {...(!nested ? { ...attributes, ...listeners } : {})}
        className={cn(
          'transition-opacity cursor-grab active:cursor-grabbing w-4 flex-shrink-0',
          'opacity-0 group-hover:opacity-100',
          nested ? 'pointer-events-none opacity-30' : ''
        )}
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      {number !== undefined && (
        <span className="text-sm font-medium text-muted-foreground mr-1 w-4 text-right select-none">{number}.</span>
      )}
      {editing && setEditing && editingTitle !== undefined && setEditingTitle && onUpdateTitle ? (
        <input
          type="text"
          value={editingTitle}
          autoFocus
          onChange={e => setEditingTitle(e.target.value)}
          onBlur={() => {
            if (editingTitle.trim() && editingTitle !== node.data.title) {
              onUpdateTitle(editingTitle.trim());
            }
            setEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (editingTitle.trim() && editingTitle !== node.data.title) {
                onUpdateTitle(editingTitle.trim());
              }
              setEditing(false);
            } else if (e.key === 'Escape') {
              setEditing(false);
            }
          }}
          className="w-full px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium bg-white"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span
          className="truncate block flex-1 cursor-text"
          title={node.data.title}
          onClick={e => {
            e.stopPropagation();
            setEditing && setEditing(true);
            setEditingTitle && setEditingTitle(node.data.title);
          }}
        >
          {node.data.title}
        </span>
      )}
      {onDelete && (
        <button
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-600"
          title="Удалить вопрос"
          onClick={e => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
      
      {/* Диалог подтверждения удаления */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Удалить вопрос"
        description={`Вы действительно хотите удалить вопрос "${node.data.title}"? Это действие нельзя отменить.`}
        onConfirm={() => onDelete?.()}
      />
    </div>
  );
} 