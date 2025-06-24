import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyStore } from '@/store/survey-store';
import type { Question, Page } from '@survey-platform/shared-types';

export function normalizePage(p: any): Page {
  let descPos: 'before' | 'after' | undefined = undefined;
  if (p.descriptionPosition === 'before' || p.descriptionPosition === 'after') {
    descPos = p.descriptionPosition;
  } else {
    descPos = 'before';
  }
  return {
    ...p,
    descriptionPosition: descPos,
  };
}

/**
 * <summary>
 * Хук для управления состоянием и данными редактора опросов.
 * Обрабатывает загрузку данных, состояние UI и базовую логику навигации.
 * </summary>
 */
export function useSurveyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { surveys, loadSurveys } = useSurveyStore();
  
  // UI State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | undefined>();
  const [editingResolution, setEditingResolution] = useState<Question | null>(null);
  const [pendingPreview, setPendingPreview] = useState(false);

  // Всегда вычисляем survey и currentVersion, даже если их нет
  const survey = surveys.find(s => s.id === id);
  const currentVersion = survey?.versions.find(v => v.version === survey.currentVersion);
  const questions = currentVersion?.questions || [];
  const pages: Page[] = (currentVersion?.pages || []).map(normalizePage);

  console.log('SurveyEditor render', {
    survey,
    currentVersion,
    questions,
    pages,
    selectedPageId,
    selectedQuestionId,
    isPreviewOpen,
    pendingPreview
  });

  // Effects
  useEffect(() => {
    console.log('useEffect pages/selectedPageId', { pages, selectedPageId });
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  useEffect(() => {
    console.log('useEffect id/survey/loadSurveys', { id, survey });
    if (id && !survey) {
      loadSurveys();
    }
  }, [id, survey, loadSurveys]);

  useEffect(() => {
    console.log('useEffect preview', { pendingPreview, questions, pages });
    if (pendingPreview) {
      setIsPreviewOpen(true);
      setPendingPreview(false);
    }
  }, [questions, pages, pendingPreview]);

  useEffect(() => {
    console.log('Переключение страницы:', { selectedPageId, questions, pages });
  }, [selectedPageId]);

  return {
    // Router data
    id,
    navigate,
    
    // Survey data
    survey,
    currentVersion,
    questions,
    pages,
    
    // UI State
    isPreviewOpen,
    setIsPreviewOpen,
    selectedPageId,
    setSelectedPageId,
    selectedQuestionId,
    setSelectedQuestionId,
    editingResolution,
    setEditingResolution,
    pendingPreview,
    setPendingPreview,
    
    // Computed
    isReady: !!(survey && currentVersion),
  };
} 