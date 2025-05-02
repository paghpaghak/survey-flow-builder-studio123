import { create } from 'zustand';
import { Survey, SurveyStatus, SurveyVersion } from '@/types/survey';
import { v4 as uuidv4 } from 'uuid';
import { fetchSurveys, createSurvey, deleteSurvey as apiDeleteSurvey, updateSurvey as apiUpdateSurvey } from '../lib/api';

/**
 * <summary>
 * Интерфейс состояния стора опросов.
 * </summary>
 */
interface SurveyState {
  /**
   * <summary>Список всех опросов в системе.</summary>
   */
  surveys: Survey[];
  /**
   * <summary>Добавляет новый опрос.</summary>
   * <param name="title">Название опроса</param>
   * <param name="description">Описание опроса</param>
   * <returns>ID созданного опроса</returns>
   */
  addSurvey: (title: string, description: string) => Promise<string | undefined>;
  /**
   * <summary>Удаляет опрос по ID.</summary>
   * <param name="id">ID опроса</param>
   */
  deleteSurvey: (id: string) => void;
  /**
   * <summary>Обновляет статус опроса.</summary>
   * <param name="id">ID опроса</param>
   * <param name="status">Новый статус</param>
   */
  updateSurveyStatus: (id: string, status: SurveyStatus) => void;
  /**
   * <summary>Обновляет опрос (и его версию).</summary>
   * <param name="updatedSurvey">Обновлённый объект опроса</param>
   * <param name="createNewVersion">Создать новую версию?</param>
   */
  updateSurvey: (updatedSurvey: Survey, createNewVersion?: boolean) => void;
  /**
   * <summary>Создаёт новую версию опроса.</summary>
   * <param name="surveyId">ID опроса</param>
   */
  createNewVersion: (surveyId: string) => void;
  /**
   * <summary>Получает версию опроса по номеру.</summary>
   * <param name="surveyId">ID опроса</param>
   * <param name="version">Номер версии</param>
   * <returns>Объект версии опроса</returns>
   */
  getVersion: (surveyId: string, version: number) => SurveyVersion | undefined;
  /**
   * <summary>Откатывает опрос к указанной версии.</summary>
   * <param name="surveyId">ID опроса</param>
   * <param name="version">Номер версии</param>
   */
  revertToVersion: (surveyId: string, version: number) => void;
  /**
   * <summary>Загружает все опросы из API.</summary>
   */
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
      const previousState = get().surveys.find(s => s.id === updatedSurvey.id);
      if (!previousState) {
        console.error('❌ Previous state not found for survey:', updatedSurvey.id);
        throw new Error('Survey not found');
      }

      const previousVersion = previousState.versions.find(v => v.version === previousState.currentVersion);
      if (!previousVersion) {
        console.error('❌ Previous version not found');
        throw new Error('Previous version not found');
      }

      const updatedVersion = updatedSurvey.versions.find(v => v.version === updatedSurvey.currentVersion);
      if (!updatedVersion) {
        console.error('❌ Updated version not found');
        throw new Error('Updated version not found');
      }

      // Create maps for quick lookups
      const previousQuestionsMap = new Map();
      previousVersion.pages.forEach(page => {
        page.questions.forEach(questionId => {
          const question = previousVersion.questions.find(q => q.id === questionId);
          if (question) {
            previousQuestionsMap.set(questionId, { ...question, pageId: page.id });
          }
        });
      });

      // Process pages and their questions
      const processedPages = updatedVersion.pages.map(page => {
        // Get all questions that belong to this page
        const pageQuestions = updatedVersion.questions
          .filter(q => q.pageId === page.id)
          .map(q => {
            const previousQuestion = previousQuestionsMap.get(q.id);
            return {
              ...q,
              pageId: page.id,
              position: q.position || previousQuestion?.position || 0
            };
          })
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        return {
          ...page,
          questions: pageQuestions.map(q => q.id)
        };
      });

      const newVersion = {
        ...updatedVersion,
        pages: processedPages,
        questions: updatedVersion.questions,
        updatedAt: new Date()
      };

      try {
        await apiUpdateSurvey({
          ...updatedSurvey,
          versions: updatedSurvey.versions.map(v =>
            v.version === updatedSurvey.currentVersion ? newVersion : v
          )
        });

        set((state) => ({
          surveys: state.surveys.map((s) =>
            s.id === updatedSurvey.id
              ? {
                  ...updatedSurvey,
                  versions: updatedSurvey.versions.map(v =>
                    v.version === updatedSurvey.currentVersion ? newVersion : v
                  )
                }
              : s
          )
        }));

      } catch (error) {
        console.error('❌ Failed to update survey:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating survey:', error);
      throw error;
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
