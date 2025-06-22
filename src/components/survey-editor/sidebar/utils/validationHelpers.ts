// src/components/survey-editor/sidebar/utils/validationHelpers.ts

import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Page, Question, QuestionType } from '@survey-platform/shared-types';
import { DragValidationResult } from '../types/tree.types';
import { isQuestionInParallelGroup, getParentParallelGroup } from './treeDataBuilder';

/**
 * Валидация операции перетаскивания вопросов
 */
export function validateDragOperation(
  activeQuestion: Question,
  overQuestion: Question,
  allQuestions: Question[]
): DragValidationResult {
  // Проверяем, находятся ли вопросы в параллельных группах
  const isActiveInParallel = isQuestionInParallelGroup(activeQuestion.id, allQuestions);
  const isOverInParallel = isQuestionInParallelGroup(overQuestion.id, allQuestions);
  
  // Запрет перемещения вопроса внутрь/вне параллельной группы
  if (isActiveInParallel !== isOverInParallel) {
    return {
      isValid: false,
      errorMessage: 'Перемещение вопросов внутрь/вне параллельной ветки запрещено.'
    };
  }
  
  // Если оба вопроса в параллельных группах, проверяем, что это одна группа
  if (isActiveInParallel && isOverInParallel) {
    const activeParentGroup = getParentParallelGroup(activeQuestion.id, allQuestions);
    const overParentGroup = getParentParallelGroup(overQuestion.id, allQuestions);
    
    if (activeParentGroup?.id !== overParentGroup?.id) {
      return {
        isValid: false,
        errorMessage: 'Перемещение вопросов между разными параллельными ветками запрещено.'
      };
    }
  }
  
  // Проверяем, что вопросы находятся на одной странице
  if (activeQuestion.pageId !== overQuestion.pageId) {
    return {
      isValid: false,
      errorMessage: 'Перемещение вопросов между страницами запрещено.'
    };
  }
  
  return { isValid: true };
}

/**
 * Проверка возможности удаления страницы
 */
export function canDeletePage(pages: Page[]): boolean {
  return pages.length > 1;
}

/**
 * Проверка возможности удаления вопроса
 */
export function canDeleteQuestion(question: Question, allQuestions: Question[]): boolean {
  // Всегда можно удалить обычный вопрос
  if (question.type !== QUESTION_TYPES.ParallelGroup) {
    return true;
  }
  
  // Для параллельных групп проверяем наличие вложенных вопросов
  return true; // Пока разрешаем удаление параллельных групп
}

/**
 * Валидация названия страницы
 */
export function validatePageTitle(title: string): DragValidationResult {
  const trimmedTitle = title.trim();
  
  if (!trimmedTitle) {
    return {
      isValid: false,
      errorMessage: 'Название страницы не может быть пустым.'
    };
  }
  
  if (trimmedTitle.length > 100) {
    return {
      isValid: false,
      errorMessage: 'Название страницы не может быть длиннее 100 символов.'
    };
  }
  
  return { isValid: true };
}

/**
 * Валидация названия вопроса
 */
export function validateQuestionTitle(title: string): DragValidationResult {
  const trimmedTitle = title.trim();
  
  if (!trimmedTitle) {
    return {
      isValid: false,
      errorMessage: 'Название вопроса не может быть пустым.'
    };
  }
  
  if (trimmedTitle.length > 200) {
    return {
      isValid: false,
      errorMessage: 'Название вопроса не может быть длиннее 200 символов.'
    };
  }
  
  return { isValid: true };
}

/**
 * Проверка существования вопроса с указанным ID
 */
export function questionExists(questionId: string, questions: Question[]): boolean {
  return questions.some(q => q.id === questionId);
}

/**
 * Проверка существования страницы с указанным ID
 */
export function pageExists(pageId: string, pages: Page[]): boolean {
  return pages.some(p => p.id === pageId);
}

/**
 * Валидация уникальности названия страницы
 */
export function validateUniquePageTitle(
  title: string, 
  pageId: string, 
  pages: Page[]
): DragValidationResult {
  const trimmedTitle = title.trim();
  const existingPage = pages.find(p => 
    p.id !== pageId && 
    p.title.toLowerCase() === trimmedTitle.toLowerCase()
  );
  
  if (existingPage) {
    return {
      isValid: false,
      errorMessage: 'Страница с таким названием уже существует.'
    };
  }
  
  return { isValid: true };
}