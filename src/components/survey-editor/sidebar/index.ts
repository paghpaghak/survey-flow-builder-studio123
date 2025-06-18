// src/components/survey-editor/sidebar/index.ts

// Типы
export type {
    TreeItemData,
    TreeEditState,
    TreeExpansionState,
    TreeActionsState,
    DragValidationResult,
    BaseTreeItemProps,
    QuestionTreeItemProps,
    ParallelGroupTreeItemProps,
    PageTreeItemProps,
  } from './types/tree.types';
  
  // Утилиты
  export {
    buildTreeData,
    getPageQuestions,
    getParallelQuestionIds,
    getFilteredPageQuestions,
    getAvailableQuestions,
    getPageById,
    getQuestionById,
    isQuestionInParallelGroup,
    getParentParallelGroup,
  } from './utils/treeDataBuilder';
  
  export {
    validateDragOperation,
    canDeletePage,
    canDeleteQuestion,
    validatePageTitle,
    validateQuestionTitle,
    questionExists,
    pageExists,
    validateUniquePageTitle,
  } from './utils/validationHelpers';
  
  // Хуки
  export { useTreeState } from './hooks/useTreeState';
  
  // Заглушка для основного компонента (пока не создан)
  // export { SidebarTreeView } from './SidebarTreeView';
  // export type { SidebarTreeViewProps } from './SidebarTreeView';