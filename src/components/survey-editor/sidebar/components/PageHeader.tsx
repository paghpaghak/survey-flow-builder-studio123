import React, { useState } from 'react';
import { Page } from '@survey-platform/shared-types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Trash, Pencil } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

interface PageHeaderProps {
  page: Page;
  pages: Page[];
  isSelected: boolean;
  isEditing: boolean;
  isPageExpanded: boolean;
  editingTitle: string;
  onSelectPage: (pageId: string) => void;
  onSelectQuestion: (questionId: string | undefined) => void;
  onUpdatePageTitle?: (pageId: string, newTitle: string) => void;
  onDeletePage?: (pageId: string) => void;
  setEditingPageId: (id: string | null) => void;
  setEditingTitle: (title: string) => void;
  setExpandedPages: (pages: Record<string, boolean> | ((p: Record<string, boolean>) => Record<string, boolean>)) => void;
  setEditPageId: (id: string | null) => void;
  setEditDescription: (desc: string) => void;
  setDescriptionPosition: (pos: string) => void;
}

export function PageHeader({
  page,
  pages,
  isSelected,
  isEditing,
  isPageExpanded,
  editingTitle,
  onSelectPage,
  onSelectQuestion,
  onUpdatePageTitle,
  onDeletePage,
  setEditingPageId,
  setEditingTitle,
  setExpandedPages,
  setEditPageId,
  setEditDescription,
  setDescriptionPosition,
}: PageHeaderProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  return (
    <div
      onClick={() => {
        onSelectPage(page.id);
        onSelectQuestion(undefined);
      }}
      className={cn(
        'flex items-center px-4 py-2 border-b rounded-t-lg transition-all cursor-pointer select-none w-full group',
        isSelected ? 'bg-primary/10' : '',
      )}
    >
      <span
        className="mr-2 flex-shrink-0"
        onClick={e => {
          e.stopPropagation();
          setExpandedPages(p => ({ ...p, [page.id]: !isPageExpanded }));
        }}
        title={isPageExpanded ? 'Скрыть вопросы страницы' : 'Показать вопросы страницы'}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {isPageExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </span>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            autoFocus
            onChange={e => setEditingTitle(e.target.value)}
            onBlur={() => {
              if (editingTitle.trim() && editingTitle !== page.title) {
                onUpdatePageTitle?.(page.id, editingTitle.trim());
              }
              setEditingPageId(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (editingTitle.trim() && editingTitle !== page.title) {
                  onUpdatePageTitle?.(page.id, editingTitle.trim());
                }
                setEditingPageId(null);
              } else if (e.key === 'Escape') {
                setEditingPageId(null);
              }
            }}
            className="w-full px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-base font-medium bg-white"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="truncate block cursor-text text-base font-semibold"
            title={page.title}
            onClick={e => {
              e.stopPropagation();
              setEditingPageId(page.id);
              setEditingTitle(page.title);
            }}
          >
            {page.title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onDeletePage && pages.length > 1 && (
          <button
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-600"
            title="Удалить страницу"
            onClick={e => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash className="w-4 h-4" />
          </button>
        )}
        <button
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
          title="Редактировать страницу"
          onClick={e => {
            e.stopPropagation();
            setEditPageId(page.id);
            setEditDescription(page.description || '');
            setDescriptionPosition(
              typeof page.descriptionPosition === 'string'
                ? page.descriptionPosition
                : 'after'
            );
          }}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Диалог подтверждения удаления */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Удалить страницу"
        description={`Вы действительно хотите удалить страницу "${page.title}"? Это действие нельзя отменить.`}
        onConfirm={() => onDeletePage?.(page.id)}
      />
    </div>
  );
} 