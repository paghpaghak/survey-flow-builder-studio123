import { create } from 'zustand';
import { Survey, SurveyStatus, SurveyVersion } from '@/types/survey';
import { v4 as uuidv4 } from 'uuid';
import { fetchSurveys, createSurvey, deleteSurvey as apiDeleteSurvey, updateSurvey as apiUpdateSurvey } from '../lib/api';

interface SurveyState {
  surveys: Survey[];
  addSurvey: (title: string, description: string) => Promise<string | undefined>;
  deleteSurvey: (id: string) => void;
  updateSurveyStatus: (id: string, status: SurveyStatus) => void;
  updateSurvey: (updatedSurvey: Survey, createNewVersion?: boolean) => void;
  createNewVersion: (surveyId: string) => void;
  getVersion: (surveyId: string, version: number) => SurveyVersion | undefined;
  revertToVersion: (surveyId: string, version: number) => void;
  loadSurveys: () => Promise<void>;
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
      console.log('Создание опроса через API...');
      const now = new Date();
      const initialPage = {
        id: crypto.randomUUID(),
        title: 'Страница 1',
        questions: []
      };
      const initialVersion = {
        id: crypto.randomUUID(),
        surveyId: '', // будет заполнено на сервере или после создания
        version: 1,
        status: 'draft' as SurveyStatus,
        title,
        description,
        questions: [],
        pages: [initialPage],
        createdAt: now,
        updatedAt: now
      };
      await createSurvey({
        title,
        description,
        status: 'draft',
        currentVersion: 1,
        versions: [initialVersion],
        createdAt: now,
        updatedAt: now,
      });
      await get().loadSurveys();
      return undefined;
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
  
  updateSurveyStatus: (id, status) => set((state) => ({
    surveys: state.surveys.map((survey) => 
      survey.id === id ? { ...survey, status, updatedAt: new Date() } : survey
    ),
  })),
  
  updateSurvey: async (updatedSurvey, createNewVersion = false) => {
    try {
      console.log('Updating survey in store:', updatedSurvey);
      set((state) => ({
        surveys: state.surveys.map((s) => 
          s.id === updatedSurvey.id ? { ...s, ...updatedSurvey, updatedAt: new Date() } : s
        ),
      }));

      const updated = await apiUpdateSurvey(updatedSurvey);
      console.log('Server response:', updated);
      set((state) => ({
        surveys: state.surveys.map((s) => 
          s.id === updated.id ? { ...updated, updatedAt: new Date() } : s
        ),
      }));
    } catch (error) {
      console.error('Ошибка при обновлении опроса:', error);
      set((state) => ({
        surveys: state.surveys.map((s) => 
          s.id === updatedSurvey.id ? { ...s, ...updatedSurvey, updatedAt: new Date() } : s
        ),
      }));
    }
  },

  createNewVersion: (surveyId) => {
    const state = get();
    const survey = state.surveys.find(s => s.id === surveyId);
    if (!survey) return;

    const currentVersion = survey.versions.find(v => v.version === survey.currentVersion);
    if (!currentVersion) return;

    const newVersion: SurveyVersion = {
      id: uuidv4(),
      surveyId,
      version: survey.currentVersion + 1,
      status: 'draft',
      title: survey.title,
      description: survey.description,
      questions: [...currentVersion.questions],
      pages: [...currentVersion.pages],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSurvey = {
      ...survey,
      currentVersion: newVersion.version,
      versions: [...survey.versions, newVersion],
      updatedAt: new Date()
    };

    set((state) => ({
      surveys: state.surveys.map((s) => 
        s.id === surveyId ? updatedSurvey : s
      ),
    }));
  },

  getVersion: (surveyId, version) => {
    const state = get();
    const survey = state.surveys.find(s => s.id === surveyId);
    return survey?.versions.find(v => v.version === version);
  },

  revertToVersion: (surveyId, version) => {
    const state = get();
    const survey = state.surveys.find(s => s.id === surveyId);
    if (!survey) return;

    const targetVersion = survey.versions.find(v => v.version === version);
    if (!targetVersion) return;

    // Create a new version based on the target version
    const newVersion: SurveyVersion = {
      id: uuidv4(),
      surveyId,
      version: survey.currentVersion + 1,
      status: 'draft',
      title: targetVersion.title,
      description: targetVersion.description,
      questions: [...targetVersion.questions],
      pages: [...targetVersion.pages],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSurvey = {
      ...survey,
      title: targetVersion.title,
      description: targetVersion.description,
      currentVersion: newVersion.version,
      versions: [...survey.versions, newVersion],
      updatedAt: new Date()
    };

    set((state) => ({
      surveys: state.surveys.map((s) => 
        s.id === surveyId ? updatedSurvey : s
      ),
    }));
  },
}));
