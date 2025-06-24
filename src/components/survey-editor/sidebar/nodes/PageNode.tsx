import React from 'react';
import { Page, Question } from '@survey-platform/shared-types';
import { cn } from '@/lib/utils';
import { usePageNodeLogic } from '../hooks/usePageNodeLogic';
import { ResolutionDisplay, PageHeader, PageContent, PageEditDialog } from '../components';

// We need to pass a lot of props from the main TreeView.
// This is acceptable for now to avoid premature context creation.
interface PageNodeProps {
  page: Page;
  pages: Page[];
  questions: Question[];
  selectedPageId?: string;
  selectedQuestionId?: string;
  onSelectPage: (pageId: string) => void;
  onSelectQuestion: (questionId: string | undefined) => void;
  onUpdatePageTitle?: (pageId: string, newTitle: string) => void;
  onUpdateQuestionTitle?: (questionId: string, newTitle: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onDeletePage?: (pageId: string) => void;
  onUpdatePageDescription?: (pageId: string, newDescription: string, position: string) => void;
  onEditResolution?: (resolution: Question) => void;

  // State from useSidebarState hook
  editingPageId: string | null;
  setEditingPageId: (id: string | null) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (id: string | null) => void;
  editingQuestionTitle: string;
  setEditingQuestionTitle: (title: string) => void;
  expandedGroups: Record<string, boolean>;
  setExpandedGroups: (groups: Record<string, boolean> | ((g: Record<string, boolean>) => Record<string, boolean>)) => void;
  expandedPages: Record<string, boolean>;
  setExpandedPages: (pages: Record<string, boolean> | ((p: Record<string, boolean>) => Record<string, boolean>)) => void;
  confirmDeleteParallelId: string | null;
  setConfirmDeleteParallelId: (id: string | null) => void;
  editPageId: string | null;
  setEditPageId: (id: string | null) => void;
  editDescription: string;
  setEditDescription: (desc: string) => void;
  descriptionPosition: string;
  setDescriptionPosition: (pos: string) => void;
  descriptionRefs: React.MutableRefObject<Record<string, HTMLTextAreaElement | null>>;
  handleInsertVariable: (questionId: string, pageId: string) => void;
}

export const PageNode: React.FC<PageNodeProps> = ({
  page,
  pages,
  questions,
  selectedPageId,
  selectedQuestionId,
  onSelectPage,
  onSelectQuestion,
  onUpdatePageTitle,
  onUpdateQuestionTitle,
  onDeleteQuestion,
  onDeletePage,
  onUpdatePageDescription,
  onEditResolution,
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
}) => {
  const {
    pageQuestions,
    isEditing,
    isSelected,
    isPageExpanded,
    availableQuestions,
    resolution,
  } = usePageNodeLogic({
    page,
    pages,
    questions,
    selectedPageId,
    editingPageId,
    expandedPages,
  });

  // Если есть резолюция, показываем только её
  if (resolution) {
    return (
      <ResolutionDisplay
        resolution={resolution}
        selectedQuestionId={selectedQuestionId}
        onSelectQuestion={onSelectQuestion}
        onEditResolution={onEditResolution}
      />
    );
  }

  return (
    <div
      key={page.id}
      className={cn(
        'rounded-lg border bg-white shadow-sm mb-4 transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/40'
      )}
    >
      <PageHeader
        page={page}
        pages={pages}
        isSelected={isSelected}
        isEditing={isEditing}
        isPageExpanded={isPageExpanded}
        editingTitle={editingTitle}
        onSelectPage={onSelectPage}
        onSelectQuestion={onSelectQuestion}
        onUpdatePageTitle={onUpdatePageTitle}
        onDeletePage={onDeletePage}
        setEditingPageId={setEditingPageId}
        setEditingTitle={setEditingTitle}
        setExpandedPages={setExpandedPages}
        setEditPageId={setEditPageId}
        setEditDescription={setEditDescription}
        setDescriptionPosition={setDescriptionPosition}
      />
      
      <PageContent
        pageQuestions={pageQuestions}
        isPageExpanded={isPageExpanded}
        questions={questions}
        selectedQuestionId={selectedQuestionId}
        onSelectQuestion={onSelectQuestion}
        onUpdateQuestionTitle={onUpdateQuestionTitle}
        onDeleteQuestion={onDeleteQuestion}
        editingQuestionId={editingQuestionId}
        setEditingQuestionId={setEditingQuestionId}
        editingQuestionTitle={editingQuestionTitle}
        setEditingQuestionTitle={setEditingQuestionTitle}
        expandedGroups={expandedGroups}
        setExpandedGroups={setExpandedGroups}
        setConfirmDeleteParallelId={setConfirmDeleteParallelId}
      />
      
      <PageEditDialog
        page={page}
        editPageId={editPageId}
        editDescription={editDescription}
        descriptionPosition={descriptionPosition}
        availableQuestions={availableQuestions}
        setEditPageId={setEditPageId}
        setEditDescription={setEditDescription}
        setDescriptionPosition={setDescriptionPosition}
        onUpdatePageDescription={onUpdatePageDescription}
        descriptionRefs={descriptionRefs}
        handleInsertVariable={handleInsertVariable}
      />
    </div>
  );
}; 