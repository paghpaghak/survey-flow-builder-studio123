// src/components/survey-editor/sidebar/types/tree.types.ts

import { NodeApi } from 'react-arborist';
import type { Page, Question } from '@survey-platform/shared-types';

/**
 * Данные элемента дерева для навигации
 */
export interface TreeItemData {
  id: string;
  type: 'page' | 'question' | 'parallel_group';
  title: string;
  parentId?: string;
}

/**
 * Состояние редактирования элементов дерева
 */
export interface TreeEditState {
  editingPageId: string | null;
  editingQuestionId: string | null;
  editingTitle: string;
  editingQuestionTitle: string;
}

/**
 * Состояние раскрытия/скрытия элементов дерева
 */
export interface TreeExpansionState {
  expandedGroups: Record<string, boolean>;
  expandedPages: Record<string, boolean>;
}

/**
 * Состояние действий и диалогов
 */
export interface TreeActionsState {
  confirmDeleteParallelId: string | null;
  editPageId: string | null;
  editDescription: string;
  descriptionPosition: 'before' | 'after';
}

/**
 * Результат валидации операции перетаскивания
 */
export interface DragValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Пропсы для базового элемента дерева
 */
export interface BaseTreeItemProps {
  id: string;
  isSelected: boolean;
  onSelect: () => void;
  draggable?: boolean;
  nested?: boolean;
  className?: string;
}

/**
 * Пропсы для компонента вопроса в дереве
 */
export interface QuestionTreeItemProps extends BaseTreeItemProps {
  question: Question;
  number?: number;
  isEditing: boolean;
  editingTitle: string;
  onStartEdit: () => void;
  onUpdateTitle: (title: string) => void;
  onFinishEdit: () => void;
  onDelete: () => void;
}

/**
 * Пропсы для компонента параллельной группы в дереве
 */
export interface ParallelGroupTreeItemProps extends BaseTreeItemProps {
  parallelGroup: Question;
  questions: Question[];
  index: number;
  isExpanded: boolean;
  selectedQuestionId?: string;
  editState: TreeEditState;
  onToggleExpand: () => void;
  onSelectQuestion: (id: string) => void;
  onUpdateQuestionTitle: (id: string, title: string) => void;
  onDeleteQuestion: (id: string) => void;
  onStartEditQuestion: (id: string, title: string) => void;
  onFinishEditQuestion: () => void;
  onDeleteParallelGroup: (id: string) => void;
}

/**
 * Пропсы для компонента страницы в дереве
 */
export interface PageTreeItemProps extends BaseTreeItemProps {
  page: Page;
  questions: Question[];
  isExpanded: boolean;
  isEditing: boolean;
  editingTitle: string;
  selectedQuestionId?: string;
  editState: TreeEditState;
  expansionState: TreeExpansionState;
  canDelete: boolean;
  availableQuestions: Question[];
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onUpdateTitle: (title: string) => void;
  onFinishEdit: () => void;
  onDelete: () => void;
  onEditDescription: () => void;
  onSelectQuestion: (id: string) => void;
  onUpdateQuestionTitle: (id: string, title: string) => void;
  onDeleteQuestion: (id: string) => void;
}

export type NodeType = 'page' | 'question' | 'parallel_group';