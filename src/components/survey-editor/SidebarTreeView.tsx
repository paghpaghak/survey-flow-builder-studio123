import React, { useState } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Page, Question, QuestionType } from '@survey-platform/shared-types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical, Trash, ChevronDown, ChevronRight, Repeat2, Pencil, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTreeData } from './sidebar/hooks/useTreeData';
import { SortableQuestionNode } from './sidebar/nodes/SortableQuestionNode';
import { RenderParallelBranch } from './sidebar/nodes/RenderParallelBranch';
import { SortableParallelGroupNode } from './sidebar/nodes/SortableParallelGroupNode';
import { useSidebarState } from './sidebar/hooks/useSidebarState';
import { useQuestionDragAndDrop } from './sidebar/hooks/useQuestionDragAndDrop';
import { PageNode } from './sidebar/nodes/PageNode';

interface SidebarTreeViewProps {
  pages: Page[];
  questions: Question[];
  selectedPageId?: string;
  selectedQuestionId?: string;
  onSelectPage: (pageId: string) => void;
  onSelectQuestion: (questionId: string | undefined) => void;
  onQuestionOrderChange?: (questions: Question[]) => void;
  onUpdatePageTitle?: (pageId: string, newTitle: string) => void;
  onUpdateQuestionTitle?: (questionId: string, newTitle: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onDeletePage?: (pageId: string) => void;
  onUpdatePageDescription?: (pageId: string, newDescription: string, position: string) => void;
  onAddResolution?: () => void;
  onEditResolution?: (resolution: Question) => void;
}

type TreeNodeData = {
  id: string;
  type: 'page' | 'question' | 'parallel_group';
  title: string;
  parentId?: string;
};

/**
 * <summary>
 * Дерево страниц и вопросов для навигации и управления структурой опроса.
 * </summary>
 * <param name="pages">Список страниц</param>
 * <param name="questions">Список вопросов</param>
 * <param name="selectedPageId">ID выбранной страницы</param>
 * <param name="selectedQuestionId">ID выбранного вопроса</param>
 * <param name="onSelectPage">Колбэк для выбора страницы</param>
 * <param name="onSelectQuestion">Колбэк для выбора вопроса</param>
 */
export const SidebarTreeView: React.FC<SidebarTreeViewProps> = ({
  pages,
  questions,
  selectedPageId,
  selectedQuestionId,
  onSelectPage,
  onSelectQuestion,
  onQuestionOrderChange,
  onUpdatePageTitle,
  onUpdateQuestionTitle,
  onDeleteQuestion,
  onDeletePage,
  onUpdatePageDescription,
  onAddResolution,
  onEditResolution,
}) => {
  const { treeData } = useTreeData(pages, questions);
  const {
    activeId,
    setActiveId,
    editingPageId,
    setEditingPageId,
    editingTitle,
    setEditingTitle,
    editingQuestionId,
    setEditingQuestionId,
    editingQuestionTitle,
    setEditingQuestionTitle,
    expandedGroups,
    setExpandedGroups,
    expandedPages,
    setExpandedPages,
    confirmDeleteParallelId,
    setConfirmDeleteParallelId,
    editPageId,
    setEditPageId,
    editDescription,
    setEditDescription,
    descriptionPosition,
    setDescriptionPosition,
    descriptionRefs,
    handleInsertVariable,
  } = useSidebarState();

  const { handleDragEnd } = useQuestionDragAndDrop({
    questions,
    setActiveId,
    onQuestionOrderChange,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <div className="p-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={event => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="space-y-4">
          {pages.map(page => (
            <PageNode
              key={page.id}
              page={page}
              pages={pages}
              questions={questions}
              selectedPageId={selectedPageId}
              selectedQuestionId={selectedQuestionId}
              onSelectPage={onSelectPage}
              onSelectQuestion={onSelectQuestion}
              onUpdatePageTitle={onUpdatePageTitle}
              onUpdateQuestionTitle={onUpdateQuestionTitle}
              onDeleteQuestion={onDeleteQuestion}
              onDeletePage={onDeletePage}
              onUpdatePageDescription={onUpdatePageDescription}
              onEditResolution={onEditResolution}
              editingPageId={editingPageId}
              setEditingPageId={setEditingPageId}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              editingQuestionId={editingQuestionId}
              setEditingQuestionId={setEditingQuestionId}
              editingQuestionTitle={editingQuestionTitle}
              setEditingQuestionTitle={setEditingQuestionTitle}
              expandedGroups={expandedGroups}
              setExpandedGroups={setExpandedGroups}
              expandedPages={expandedPages}
              setExpandedPages={setExpandedPages}
              confirmDeleteParallelId={confirmDeleteParallelId}
              setConfirmDeleteParallelId={setConfirmDeleteParallelId}
              editPageId={editPageId}
              setEditPageId={setEditPageId}
              editDescription={editDescription}
              setEditDescription={setEditDescription}
              descriptionPosition={descriptionPosition}
              setDescriptionPosition={setDescriptionPosition}
              descriptionRefs={descriptionRefs}
              handleInsertVariable={handleInsertVariable}
            />
          ))}
          {onAddResolution && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              disabled={questions.some(q => q.type === 'resolution')}
              onClick={onAddResolution}
            >
              <Scale className="w-4 h-4 mr-1" /> Добавить резолюцию
            </Button>
          )}
        </div>
        <DragOverlay>
          {activeId && questions.find(q => q.id === activeId) ? (
            <SortableQuestionNode
              node={{
                data: {
                  ...questions.find(q => q.id === activeId),
                  type: 'question',
                  title: questions.find(q => q.id === activeId)?.title || 'Без названия',
                },
              }}
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)', background: 'white' }}
              isSelected={false}
              onSelect={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {/* Диалог подтверждения удаления ветки */}
      {confirmDeleteParallelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="font-bold mb-2">Удалить параллельную ветку?</div>
            <div className="mb-4 text-sm text-gray-600">
              Будут удалены все вложенные вопросы этой ветки. Это действие нельзя отменить.
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-100" onClick={() => setConfirmDeleteParallelId(null)}>Отмена</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white"
                onClick={() => {
                  if (onDeleteQuestion) {
                    // Удаляем ветку и все вложенные вопросы
                    const parallel = questions.find(q => q.id === confirmDeleteParallelId);
                    if (parallel) {
                      onDeleteQuestion(parallel.id);
                      (parallel.parallelQuestions || []).forEach(subId => onDeleteQuestion(subId));
                    }
                  }
                  setConfirmDeleteParallelId(null);
                }}
              >Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 