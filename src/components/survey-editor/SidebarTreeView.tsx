import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { Page, Question } from '@survey-platform/shared-types';
import { useTreeData } from './sidebar/hooks/useTreeData';
import { useSidebarTreeLogic } from './sidebar/hooks/useSidebarTreeLogic';
import { PageNode } from './sidebar/nodes/PageNode';
import { 
  ConfirmDeleteDialog, 
  AddResolutionButton, 
  TreeDragOverlay 
} from './sidebar/components';

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
    // Состояние
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
    
    // Drag & Drop
    handleDragEnd,
    sensors,
  } = useSidebarTreeLogic({
    questions,
    onQuestionOrderChange,
  });

  const handleConfirmDelete = () => {
    if (onDeleteQuestion && confirmDeleteParallelId) {
      // Удаляем ветку и все вложенные вопросы
      const parallel = questions.find(q => q.id === confirmDeleteParallelId);
      if (parallel) {
        onDeleteQuestion(parallel.id);
        (parallel.parallelQuestions || []).forEach(subId => onDeleteQuestion(subId));
      }
    }
    setConfirmDeleteParallelId(null);
  };

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
          
          <AddResolutionButton
            questions={questions}
            onAddResolution={onAddResolution}
          />
        </div>
        
        <TreeDragOverlay
          activeId={activeId}
          questions={questions}
        />
      </DndContext>
      
      <ConfirmDeleteDialog
        confirmDeleteParallelId={confirmDeleteParallelId}
        onClose={() => setConfirmDeleteParallelId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}; 