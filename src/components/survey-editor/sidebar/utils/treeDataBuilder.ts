// src/components/survey-editor/sidebar/utils/treeDataBuilder.ts

import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Page, Question, QuestionType } from '@survey-platform/shared-types';
import { TreeItemData } from '../types/tree.types';

/**
 * Построение данных для дерева навигации
 */
export function buildTreeData(pages: Page[], questions: Question[]): TreeItemData[] {
  const nodes: TreeItemData[] = [];
  
  for (const page of pages) {
    nodes.push({ 
      id: page.id, 
      type: 'page', 
      title: page.title 
    });
    
    const pageQuestions = questions.filter(q => q.pageId === page.id);
    const usedIds = new Set<string>();
    
    // Сначала добавляем параллельные группы
    for (const q of pageQuestions) {
      if (q.type === QUESTION_TYPES.ParallelGroup) {
        nodes.push({ 
          id: q.id, 
          type: 'parallel_group', 
          title: q.title, 
          parentId: page.id 
        });
        
        // Отмечаем вложенные вопросы как использованные
        (q.parallelQuestions || []).forEach((subId) => {
          usedIds.add(subId);
        });
      }
    }
    
    // Затем добавляем обычные вопросы (исключая вложенные)
    for (const q of pageQuestions) {
      if (q.type !== QUESTION_TYPES.ParallelGroup && !usedIds.has(q.id)) {
        nodes.push({ 
          id: q.id, 
          type: 'question', 
          title: q.title || 'Без названия', 
          parentId: page.id 
        });
      }
    }
  }
  
  return nodes;
}

/**
 * Получение вопросов конкретной страницы
 */
export function getPageQuestions(pageId: string, questions: Question[]): Question[] {
  return questions.filter(q => q.pageId === pageId);
}

/**
 * Получение ID всех вложенных вопросов параллельных групп
 */
export function getParallelQuestionIds(questions: Question[]): Set<string> {
  const parallelIds = new Set<string>();
  
  questions.forEach(q => {
    if (q.type === QUESTION_TYPES.ParallelGroup && Array.isArray(q.parallelQuestions)) {
      q.parallelQuestions.forEach(id => parallelIds.add(id));
    }
  });
  
  return parallelIds;
}

/**
 * Фильтрация вопросов страницы с учетом параллельных групп
 */
export function getFilteredPageQuestions(pageId: string, questions: Question[]): Question[] {
  const pageQuestions = getPageQuestions(pageId, questions);
  const parallelIds = getParallelQuestionIds(questions);
  
  // Возвращаем только вопросы, которые не входят в параллельные группы
  return pageQuestions.filter(q => !parallelIds.has(q.id));
}

/**
 * Получение доступных вопросов для вставки переменных
 * (вопросы с предыдущих страниц)
 */
export function getAvailableQuestions(
  currentPage: Page, 
  allPages: Page[], 
  allQuestions: Question[]
): Question[] {
  const currentPageIndex = allPages.findIndex(p => p.id === currentPage.id);
  if (currentPageIndex === -1) return [];
  
  const previousPages = allPages.slice(0, currentPageIndex);
  return previousPages.flatMap(page => 
    allQuestions.filter(q => q.pageId === page.id)
  );
}

/**
 * Поиск страницы по ID
 */
export function getPageById(pageId: string | null, pages: Page[]): Page | null {
  if (!pageId) return null;
  return pages.find(p => p.id === pageId) || null;
}

/**
 * Поиск вопроса по ID
 */
export function getQuestionById(questionId: string | null, questions: Question[]): Question | null {
  if (!questionId) return null;
  return questions.find(q => q.id === questionId) || null;
}

/**
 * Проверка, является ли вопрос вложенным в параллельную группу
 */
export function isQuestionInParallelGroup(questionId: string, questions: Question[]): boolean {
  return questions.some(q => 
    q.type === QUESTION_TYPES.ParallelGroup && 
    q.parallelQuestions?.includes(questionId)
  );
}

/**
 * Получение родительской параллельной группы для вопроса
 */
export function getParentParallelGroup(questionId: string, questions: Question[]): Question | null {
  return questions.find(q => 
    q.type === QUESTION_TYPES.ParallelGroup && 
    q.parallelQuestions?.includes(questionId)
  ) || null;
}