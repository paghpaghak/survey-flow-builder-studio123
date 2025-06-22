import { useMemo } from 'react';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Page, Question } from '@survey-platform/shared-types';
import type { TreeItemData } from '../types/tree.types';

function buildTreeData(pages: Page[], questions: Question[]): TreeItemData[] {
  const nodes: TreeItemData[] = [];
  const allParallelQuestionIds = new Set<string>();

  questions.forEach(q => {
    if (q.type === QUESTION_TYPES.ParallelGroup && Array.isArray(q.parallelQuestions)) {
      q.parallelQuestions.forEach(id => allParallelQuestionIds.add(id));
    }
  });

  for (const page of pages) {
    nodes.push({ 
      id: page.id, 
      type: 'page', 
      title: page.title,
      children: [],
    });

    const currentPageNode = nodes[nodes.length - 1];
    const pageQuestions = questions.filter(q => q.pageId === page.id);
    
    // Сначала добавляем параллельные группы
    for (const q of pageQuestions) {
      if (q.type === QUESTION_TYPES.ParallelGroup) {
        const parallelGroupNode: TreeItemData = { 
          id: q.id, 
          type: 'parallel_group', 
          title: q.title, 
          parentId: page.id,
          children: [],
        };
        
        (q.parallelQuestions || []).forEach((subId) => {
          const subQuestion = questions.find(sq => sq.id === subId);
          if (subQuestion) {
            parallelGroupNode.children.push({
              id: subQuestion.id,
              type: 'question',
              title: subQuestion.title || 'Без названия',
              parentId: q.id,
            });
          }
        });
        currentPageNode.children.push(parallelGroupNode);
      }
    }

    // Затем добавляем обычные вопросы (не входящие в параллельные группы)
    for (const q of pageQuestions) {
      if (q.type !== QUESTION_TYPES.ParallelGroup && !allParallelQuestionIds.has(q.id)) {
        currentPageNode.children.push({ 
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


export function useTreeData(pages: Page[], questions: Question[]) {
  const treeData = useMemo(() => buildTreeData(pages, questions), [pages, questions]);

  return { treeData };
} 