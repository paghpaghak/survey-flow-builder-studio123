import type {
  Page,
  Question,
  Survey,
  SurveyStatus,
  SurveyVersion,
} from '@survey-platform/shared-types';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  createSurvey,
  deleteSurvey as apiDeleteSurvey,
  fetchSurveys,
  updateSurvey as apiUpdateSurvey,
} from '../lib/api';

interface SurveyState {
  surveys: Survey[];
  addSurvey: (
    title: string,
    description: string,
  ) => Promise<string | undefined>;
  deleteSurvey: (id: string) => Promise<void>;
  updateSurveyStatus: (id: string, status: SurveyStatus) => void;
  updateSurvey: (updatedSurvey: Survey) => Promise<void>;
  createNewVersion: (surveyId: string) => void;
  getVersion: (surveyId: string, version: number) => SurveyVersion | undefined;
  revertToVersion: (surveyId: string, version: number) => void;
  loadSurveys: () => Promise<void>;
  findQuestionById: (
    surveyId: string,
    questionId: string,
  ) => Question | undefined;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],

  loadSurveys: async () => {
    try {
      const surveys = await fetchSurveys();
      set({ surveys });
    } catch (error) {
      console.error('Failed to load surveys:', error);
    }
  },

  addSurvey: async (title, description) => {
    try {
      const now = new Date().toISOString();
      const newSurveyId = uuidv4();

      const initialPage: Page = {
        id: uuidv4(),
        title: 'Страница 1',
        questions: [],
      };

      const initialVersion: SurveyVersion = {
        id: uuidv4(),
        surveyId: newSurveyId,
        version: 1,
        status: 'draft',
        title,
        description,
        questions: [],
        pages: [initialPage],
        createdAt: now,
        updatedAt: now,
      };

      const newSurvey: Survey = {
        id: newSurveyId,
        title,
        description,
        status: 'draft',
        currentVersion: 1,
        versions: [initialVersion],
        createdAt: now,
        updatedAt: now,
        responsesCount: 0,
      };

      await createSurvey(newSurvey);
      await get().loadSurveys();
      return newSurvey.id;
    } catch (error) {
      console.error('Ошибка при создании опроса:', error);
      throw error;
    }
  },

  deleteSurvey: async (id) => {
    try {
      await apiDeleteSurvey(id);
      await get().loadSurveys();
    } catch (error) {
      console.error('Ошибка при удалении опроса:', error);
    }
  },

  updateSurveyStatus: (id, status) =>
    set((state) => ({
      surveys: state.surveys.map((survey) =>
        survey.id === id
          ? { ...survey, status, updatedAt: new Date().toISOString() }
          : survey,
      ),
    })),

  updateSurvey: async (updatedSurvey) => {
    try {
      await apiUpdateSurvey(updatedSurvey);
      set((state) => ({
        surveys: state.surveys.map((s) =>
          s.id === updatedSurvey.id ? updatedSurvey : s,
        ),
      }));
    } catch (error) {
      console.error('Error updating survey:', error);
      throw error;
    }
  },

  createNewVersion: (surveyId) => {
    set((state) => {
      const survey = state.surveys.find((s) => s.id === surveyId);
      if (!survey) return state;

      const currentVersion = survey.versions.find(
        (v) => v.version === survey.currentVersion,
      );
      if (!currentVersion) return state;

      const newVersionNumber =
        Math.max(...survey.versions.map((v) => v.version)) + 1;

      const newVersion: SurveyVersion = {
        ...currentVersion,
        id: uuidv4(),
        version: newVersionNumber,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedSurvey: Survey = {
        ...survey,
        currentVersion: newVersionNumber,
        versions: [...survey.versions, newVersion],
      };

      // Немедленно вызываем обновление на сервере
      get().updateSurvey(updatedSurvey);

      return {
        surveys: state.surveys.map((s) =>
          s.id === surveyId ? updatedSurvey : s,
        ),
      };
    });
  },

  getVersion: (surveyId, version) => {
    const survey = get().surveys.find((s) => s.id === surveyId);
    return survey?.versions.find((v) => v.version === version);
  },

  revertToVersion: (surveyId, version) => {
    set((state) => {
      const surveys = state.surveys.map((survey) => {
        if (survey.id === surveyId) {
          const versionExists = survey.versions.some((v) => v.version === version);
          if (versionExists) {
            const updatedSurvey = { ...survey, currentVersion: version };
            // Немедленно вызываем обновление на сервере
            get().updateSurvey(updatedSurvey);
            return updatedSurvey;
          }
        }
        return survey;
      });
      return { surveys };
    });
  },

  findQuestionById: (surveyId, questionId) => {
    const survey = get().surveys.find((s) => s.id === surveyId);
    if (!survey) return undefined;

    const currentVersion = survey.versions.find(
      (v) => v.version === survey.currentVersion,
    );
    return currentVersion?.questions.find((q) => q.id === questionId);
  },
})); 