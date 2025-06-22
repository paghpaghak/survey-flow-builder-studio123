import { create } from 'zustand';
import { Survey, SurveyStatus, SurveyVersion } from '@/types/survey';
import { fetchSurveys, createSurvey, deleteSurvey as apiDeleteSurvey, updateSurvey as apiUpdateSurvey } from "../lib/api";

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
      const now = new Date().toISOString();
      const initialPage = {
        id: crypto.randomUUID(),
        title: 'Страница 1',
        questions: [] as any[],
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
        publishedVersion: 1,
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
      survey.id === id ? { ...survey, status, updatedAt: new Date().toISOString() } : survey
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
        page.questions.forEach((question) => {
          const questionId = typeof question === 'string' ? question : question.id;
          const questionObj = previousVersion.questions.find(q => q.id === questionId);
          if (questionObj) {
            previousQuestionsMap.set(questionId, { ...questionObj, pageId: page.id });
          }
        });
      });

      // Process pages and their questions (Question[])
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
          questions: pageQuestions,
        };
      });

      const newVersion = {
        ...updatedVersion,
        pages: processedPages,
        questions: updatedVersion.questions,
        updatedAt: new Date().toISOString(),
        createdAt: typeof updatedVersion.createdAt === 'string' ? updatedVersion.createdAt : '',
        publishedAt: typeof updatedVersion.publishedAt === 'string' ? updatedVersion.publishedAt : undefined,
        archivedAt: typeof updatedVersion.archivedAt === 'string' ? updatedVersion.archivedAt : undefined,
      } as Survey['versions'][number];

      try {
        await apiUpdateSurvey({
          ...updatedSurvey,
          versions: updatedSurvey.versions.map(v =>
            v.version === updatedSurvey.currentVersion ? newVersion : v
          ).map(v => ({
            ...v,
            createdAt: typeof v.createdAt === 'string' ? v.createdAt : '',
            updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : '',
            publishedAt: typeof v.publishedAt === 'string' ? v.publishedAt : undefined,
            archivedAt: typeof v.archivedAt === 'string' ? v.archivedAt : undefined,
            pages: v.pages.map(p => ({
              ...p,
              questions: (p.questions as any[]).map(q => typeof q === 'string' ? updatedVersion.questions.find(qq => qq.id === q) : q)
            })),
          }) as Survey['versions'][number]),
        });

        set((state) => ({
          surveys: state.surveys.map((s) =>
            s.id === updatedSurvey.id
              ? {
                  ...updatedSurvey,
                  versions: updatedSurvey.versions.map(v =>
                    v.version === updatedSurvey.currentVersion ? newVersion : v
                  ).map(v => ({
                    ...v,
                    createdAt: typeof v.createdAt === 'string' ? v.createdAt : '',
                    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : '',
                    publishedAt: typeof v.publishedAt === 'string' ? v.publishedAt : undefined,
                    archivedAt: typeof v.archivedAt === 'string' ? v.archivedAt : undefined,
                    pages: v.pages.map(p => ({
                      ...p,
                      questions: (p.questions as any[]).map(q => typeof q === 'string' ? updatedVersion.questions.find(qq => qq.id === q) : q)
                    })),
                  }) as Survey['versions'][number]),
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

    const now = new Date().toISOString();
    const newVersion = {
      id: crypto.randomUUID(),
      version: survey.currentVersion + 1,
      status: 'draft',
      title: survey.title,
      description: survey.description,
      questions: [...currentVersion.questions],
      pages: currentVersion.pages.map(p => ({ ...p, questions: [...p.questions] })),
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
    } as Survey['versions'][number];

    const updatedSurvey = {
      ...survey,
      currentVersion: newVersion.version,
      versions: [...survey.versions, newVersion],
      updatedAt: now,
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
    const v = survey?.versions.find(v => v.version === version);
    if (!v) return undefined;
    return { ...v, surveyId } as import('@/types/survey').SurveyVersion;
  },

  revertToVersion: (surveyId, version) => {
    const state = get();
    const survey = state.surveys.find(s => s.id === surveyId);
    if (!survey) return;

    const targetVersion = survey.versions.find(v => v.version === version);
    if (!targetVersion) return;

    const now = new Date().toISOString();
    const newVersion: Survey['versions'][number] = {
      id: crypto.randomUUID(),
      version: survey.currentVersion + 1,
      status: 'draft',
      title: targetVersion.title,
      description: targetVersion.description,
      questions: [...targetVersion.questions],
      pages: targetVersion.pages.map(p => ({ ...p, questions: [...p.questions] })),
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
    };

    const updatedSurvey = {
      ...survey,
      title: targetVersion.title,
      description: targetVersion.description,
      currentVersion: newVersion.version,
      versions: [...survey.versions, newVersion],
      updatedAt: now,
    };

    set((state) => ({
      surveys: state.surveys.map((s) => 
        s.id === surveyId ? updatedSurvey : s
      ),
    }));
  },
}));
