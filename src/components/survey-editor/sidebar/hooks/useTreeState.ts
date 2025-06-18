// src/components/survey-editor/sidebar/hooks/useTreeState.ts

import { useState, useCallback } from 'react';
import { 
  TreeEditState, 
  TreeExpansionState, 
  TreeActionsState 
} from '../types/tree.types';

/**
 * Начальные состояния
 */
const initialEditState: TreeEditState = {
  editingPageId: null,
  editingQuestionId: null,
  editingTitle: '',
  editingQuestionTitle: '',
};

const initialExpansionState: TreeExpansionState = {
  expandedGroups: {},
  expandedPages: {},
};

const initialActionsState: TreeActionsState = {
  confirmDeleteParallelId: null,
  editPageId: null,
  editDescription: '',
  descriptionPosition: 'after',
};

/**
 * Хук для управления состоянием дерева
 */
export function useTreeState() {
  const [editState, setEditState] = useState<TreeEditState>(initialEditState);
  const [expansionState, setExpansionState] = useState<TreeExpansionState>(initialExpansionState);
  const [actionsState, setActionsState] = useState<TreeActionsState>(initialActionsState);

  // Хелперы для обновления состояния редактирования
  const updateEditState = useCallback((updates: Partial<TreeEditState>) => {
    setEditState(prev => ({ ...prev, ...updates }));
  }, []);

  const startEditingPage = useCallback((pageId: string, title: string) => {
    updateEditState({
      editingPageId: pageId,
      editingTitle: title,
    });
  }, [updateEditState]);

  const startEditingQuestion = useCallback((questionId: string, title: string) => {
    updateEditState({
      editingQuestionId: questionId,
      editingQuestionTitle: title,
    });
  }, [updateEditState]);

  const finishEditing = useCallback(() => {
    setEditState(initialEditState);
  }, []);

  // Хелперы для обновления состояния раскрытия
  const updateExpansionState = useCallback((updates: Partial<TreeExpansionState>) => {
    setExpansionState(prev => ({ ...prev, ...updates }));
  }, []);

  const togglePageExpansion = useCallback((pageId: string) => {
    setExpansionState(prev => ({
      ...prev,
      expandedPages: {
        ...prev.expandedPages,
        [pageId]: !prev.expandedPages[pageId],
      },
    }));
  }, []);

  const toggleGroupExpansion = useCallback((groupId: string) => {
    setExpansionState(prev => ({
      ...prev,
      expandedGroups: {
        ...prev.expandedGroups,
        [groupId]: !prev.expandedGroups[groupId],
      },
    }));
  }, []);

  // Хелперы для обновления состояния действий
  const updateActionsState = useCallback((updates: Partial<TreeActionsState>) => {
    setActionsState(prev => ({ ...prev, ...updates }));
  }, []);

  const openEditPageDialog = useCallback((pageId: string, description: string, position: 'before' | 'after') => {
    updateActionsState({
      editPageId: pageId,
      editDescription: description,
      descriptionPosition: position,
    });
  }, [updateActionsState]);

  const closeEditPageDialog = useCallback(() => {
    updateActionsState({
      editPageId: null,
      editDescription: '',
      descriptionPosition: 'after',
    });
  }, [updateActionsState]);

  const openDeleteParallelDialog = useCallback((parallelId: string) => {
    updateActionsState({
      confirmDeleteParallelId: parallelId,
    });
  }, [updateActionsState]);

  const closeDeleteParallelDialog = useCallback(() => {
    updateActionsState({
      confirmDeleteParallelId: null,
    });
  }, [updateActionsState]);

  // Хелперы для проверки состояний
  const isPageEditing = useCallback((pageId: string) => {
    return editState.editingPageId === pageId;
  }, [editState.editingPageId]);

  const isQuestionEditing = useCallback((questionId: string) => {
    return editState.editingQuestionId === questionId;
  }, [editState.editingQuestionId]);

  const isPageExpanded = useCallback((pageId: string) => {
    return expansionState.expandedPages[pageId] !== false; // по умолчанию раскрыто
  }, [expansionState.expandedPages]);

  const isGroupExpanded = useCallback((groupId: string) => {
    return expansionState.expandedGroups[groupId] || false; // по умолчанию скрыто
  }, [expansionState.expandedGroups]);

  const isEditPageDialogOpen = useCallback(() => {
    return actionsState.editPageId !== null;
  }, [actionsState.editPageId]);

  const isDeleteParallelDialogOpen = useCallback(() => {
    return actionsState.confirmDeleteParallelId !== null;
  }, [actionsState.confirmDeleteParallelId]);

  // Сброс всех состояний
  const resetAllStates = useCallback(() => {
    setEditState(initialEditState);
    setExpansionState(initialExpansionState);
    setActionsState(initialActionsState);
  }, []);

  return {
    // Состояния
    editState,
    expansionState,
    actionsState,

    // Обновление состояний
    updateEditState,
    updateExpansionState,
    updateActionsState,

    // Редактирование
    startEditingPage,
    startEditingQuestion,
    finishEditing,

    // Раскрытие/скрытие
    togglePageExpansion,
    toggleGroupExpansion,

    // Диалоги
    openEditPageDialog,
    closeEditPageDialog,
    openDeleteParallelDialog,
    closeDeleteParallelDialog,

    // Проверки состояний
    isPageEditing,
    isQuestionEditing,
    isPageExpanded,
    isGroupExpanded,
    isEditPageDialogOpen,
    isDeleteParallelDialogOpen,

    // Сброс
    resetAllStates,
  };
}