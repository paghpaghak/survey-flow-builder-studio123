import { useState } from 'react';
import { Survey, SurveyVersion, SurveyQuestion } from '@/types/survey';

interface UseSurveyVersionsResult {
  createNewVersion: (title: string, description: string, questions: SurveyQuestion[]) => void;
  publishVersion: (version: number) => void;
  loadVersion: (version: number) => SurveyVersion | null;
  getCurrentVersion: () => SurveyVersion | null;
  getPublishedVersion: () => SurveyVersion | null;
  survey: Survey;
}

export function useSurveyVersions(initialSurvey: Survey): UseSurveyVersionsResult {
  const [survey, setSurvey] = useState<Survey>(initialSurvey);

  const createNewVersion = (title: string, description: string, questions: SurveyQuestion[]) => {
    const newVersion: SurveyVersion = {
      id: crypto.randomUUID(),
      surveyId: survey.id,
      version: survey.currentVersion + 1,
      status: 'draft',
      title,
      description,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSurvey(prev => ({
      ...prev,
      currentVersion: newVersion.version,
      versions: [...prev.versions, newVersion]
    }));
  };

  const publishVersion = (version: number) => {
    setSurvey(prev => {
      // Находим версию для публикации
      const versionToPublish = prev.versions.find(v => v.version === version);
      if (!versionToPublish) return prev;

      // Если есть опубликованная версия, архивируем её
      const updatedVersions = prev.versions.map(v => {
        if (v.status === 'published') {
          return {
            ...v,
            status: 'archived',
            archivedAt: new Date()
          };
        }
        if (v.version === version) {
          return {
            ...v,
            status: 'published',
            publishedAt: new Date()
          };
        }
        return v;
      });

      return {
        ...prev,
        publishedVersion: version,
        versions: updatedVersions
      };
    });
  };

  const loadVersion = (version: number): SurveyVersion | null => {
    return survey.versions.find(v => v.version === version) || null;
  };

  const getCurrentVersion = (): SurveyVersion | null => {
    return survey.versions.find(v => v.version === survey.currentVersion) || null;
  };

  const getPublishedVersion = (): SurveyVersion | null => {
    return survey.versions.find(v => v.status === 'published') || null;
  };

  return {
    createNewVersion,
    publishVersion,
    loadVersion,
    getCurrentVersion,
    getPublishedVersion,
    survey
  };
} 