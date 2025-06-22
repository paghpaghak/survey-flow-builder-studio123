import type { Survey, SurveyVersion, Question, SurveyStatus } from '@survey-platform/shared-types';
import { useSurveyStore } from '@/store/survey-store';
import { useCallback, useMemo } from 'react';

interface UseSurveyVersionsResult {
  createNewVersion: (title: string, description: string, questions: Question[]) => void;
  publishVersion: (version: number) => void;
  loadVersion: (version: number) => SurveyVersion | null;
  getCurrentVersion: () => SurveyVersion | null;
  getPublishedVersion: () => SurveyVersion | null;
  survey: Survey;
}

/**
 * <summary>
 * Кастомный хук для управления версиями опроса: создание, публикация, загрузка, получение текущей и опубликованной версии.
 * </summary>
 * <param name="survey">Опрос, с которым работает хук</param>
 * <returns>API для управления версиями опроса</returns>
 */
export function useSurveyVersions(survey: Survey): UseSurveyVersionsResult {
  const [surveyState, setSurveyState] = useState<Survey>(survey);

  const createNewVersion = (title: string, description: string, questions: Question[]) => {
    const lastVersion = surveyState.versions[surveyState.versions.length - 1];
    const newVersion = {
      id: crypto.randomUUID(),
      version: surveyState.currentVersion + 1,
      status: 'draft' as SurveyStatus,
      title,
      description,
      questions,
      pages: lastVersion ? lastVersion.pages : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      surveyId: surveyState.id,
    };

    setSurveyState(prev => ({
      ...prev,
      currentVersion: newVersion.version,
      versions: [
        ...prev.versions,
        newVersion,
      ],
    }));
  };

  const publishVersion = (version: number) => {
    setSurveyState(prev => {
      const updatedVersions = prev.versions.map(v => {
        if (v.status === 'published') {
          return {
            ...v,
            status: 'archived' as SurveyStatus,
            archivedAt: new Date().toISOString(),
            surveyId: prev.id,
          };
        }
        if (v.version === version) {
          return {
            ...v,
            status: 'published' as SurveyStatus,
            publishedAt: new Date().toISOString(),
            surveyId: prev.id,
          };
        }
        return { ...v, surveyId: prev.id };
      });
      return {
        ...prev,
        publishedVersion: version,
        versions: updatedVersions,
      };
    });
  };

  const loadVersion = (version: number): SurveyVersion | null => {
    const v = surveyState.versions.find(v => v.version === version);
    return v ? {
      ...v,
      surveyId: surveyState.id,
      createdAt: v.createdAt, // Оставляем как string
      updatedAt: v.updatedAt, // Оставляем как string
      publishedAt: v.publishedAt, // Уже string или undefined
      archivedAt: 'archivedAt' in v && v.archivedAt ? String(v.archivedAt) : undefined,
    } : null;
  };

  const getCurrentVersion = (): SurveyVersion | null => {
    const v = surveyState.versions.find(v => v.version === surveyState.currentVersion);
    return v ? {
      ...v,
      surveyId: surveyState.id,
      createdAt: v.createdAt, // Оставляем как string
      updatedAt: v.updatedAt, // Оставляем как string
      publishedAt: v.publishedAt, // Уже string или undefined
      archivedAt: 'archivedAt' in v && v.archivedAt ? String(v.archivedAt) : undefined,
    } : null;
  };

  const getPublishedVersion = (): SurveyVersion | null => {
    const v = surveyState.versions.find(v => v.status === 'published');
    return v ? {
      ...v,
      surveyId: surveyState.id,
      createdAt: v.createdAt, // Оставляем как string
      updatedAt: v.updatedAt, // Оставляем как string
      publishedAt: v.publishedAt, // Уже string или undefined
      archivedAt: 'archivedAt' in v && v.archivedAt ? String(v.archivedAt) : undefined,
    } : null;
  };

  return {
    createNewVersion,
    publishVersion,
    loadVersion,
    getCurrentVersion,
    getPublishedVersion,
    survey: surveyState
  };
} 