import { useState, useEffect } from 'react';
import { useSurveyStore } from '../../../store/survey-store';
import type { Page, Question } from '@survey-platform/shared-types';

export function useSurveyEditorState(id: string | undefined) {
  const { surveys, loadSurveys } = useSurveyStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | undefined>();
  const [editingResolution, setEditingResolution] = useState<Question | null>(null);
  const [pendingPreview, setPendingPreview] = useState(false);

  const survey = surveys.find(s => s.id === id);
  const currentVersion = survey?.versions.find(v => v.version === survey.currentVersion);
  const questions = currentVersion?.questions || [];
  const pages: Page[] = (currentVersion?.pages || []) as Page[];

  useEffect(() => {
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  useEffect(() => {
    if (id && !survey) {
      loadSurveys();
    }
  }, [id, survey, loadSurveys]);

  useEffect(() => {
    if (pendingPreview) {
      setIsPreviewOpen(true);
      setPendingPreview(false);
    }
  }, [questions, pages, pendingPreview]);

  return {
    survey,
    currentVersion,
    questions,
    pages,
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
  };
} 