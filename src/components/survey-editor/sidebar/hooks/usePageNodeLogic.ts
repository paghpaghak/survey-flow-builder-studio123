import { useMemo } from 'react';
import { Page, Question, QUESTION_TYPES } from '@survey-platform/shared-types';

interface UsePageNodeLogicProps {
  page: Page;
  pages: Page[];
  questions: Question[];
  selectedPageId?: string;
  editingPageId: string | null;
  expandedPages: Record<string, boolean>;
}

export function usePageNodeLogic({
  page,
  pages,
  questions,
  selectedPageId,
  editingPageId,
  expandedPages,
}: UsePageNodeLogicProps) {
  // Собираем id всех вопросов, входящих в параллельные ветки на этой странице
  const parallelIds = useMemo(() => {
    const ids = new Set<string>();
    questions.forEach(q => {
      if (q.type === QUESTION_TYPES.ParallelGroup && Array.isArray(q.parallelQuestions)) {
        q.parallelQuestions.forEach(id => ids.add(id));
      }
    });
    return ids;
  }, [questions]);

  // Оставляем только вопросы, которые не входят в параллельные ветки
  const pageQuestions = useMemo(() => 
    questions.filter(q => q.pageId === page.id && !parallelIds.has(q.id)),
    [questions, page.id, parallelIds]
  );

  // Вычисляем состояния
  const isEditing = editingPageId === page.id;
  const isSelected = page.id === selectedPageId;
  const isPageExpanded = expandedPages[page.id] !== false;

  // Для модального окна редактирования описания страницы
  const availableQuestions = useMemo(() => {
    const prevPages = pages.slice(0, pages.findIndex(p => p.id === page.id));
    return prevPages.flatMap(p => questions.filter(q => q.pageId === p.id));
  }, [pages, questions, page.id]);

  return {
    pageQuestions,
    isEditing,
    isSelected,
    isPageExpanded,
    availableQuestions,
  };
} 