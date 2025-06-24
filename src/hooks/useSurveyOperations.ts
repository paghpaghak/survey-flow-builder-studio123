import { toast } from 'sonner';
import { useSurveyStore } from '@/store/survey-store';
import { normalizePage } from './useSurveyEditor';
import type { Survey, SurveyVersion, Page, Question } from '@survey-platform/shared-types';

interface UseSurveyOperationsProps {
  survey: Survey;
  currentVersion: SurveyVersion;
  pages: Page[];
  selectedPageId?: string;
  setSelectedPageId: (id: string | undefined) => void;
  setSelectedQuestionId: (id: string | undefined) => void;
  selectedQuestionId?: string;
}

/**
 * <summary>
 * Хук для операций с опросами, страницами и обновления данных в store.
 * Инкапсулирует логику обновления survey версий и управления страницами.
 * </summary>
 */
export function useSurveyOperations({
  survey,
  currentVersion,
  pages,
  selectedPageId,
  setSelectedPageId,
  setSelectedQuestionId,
  selectedQuestionId
}: UseSurveyOperationsProps) {
  const { updateSurvey } = useSurveyStore();

  /**
   * <summary>
   * Базовая функция для обновления опроса через store.
   * Принимает изменения и применяет их к текущей версии.
   * </summary>
   */
  const updateSurveyVersion = (updates: Partial<SurveyVersion>) => {
    // Защита от вызова когда данные не готовы
    if (!survey || !currentVersion || !survey.versions) {
      console.warn('updateSurveyVersion called before data is ready');
      return;
    }

    const updatedVersion: SurveyVersion = {
      ...currentVersion,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const updatedSurvey: Survey = {
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date().toISOString()
    };

    updateSurvey(updatedSurvey);
  };

  /**
   * <summary>
   * Обновляет список страниц опроса.
   * </summary>
   * <param name="updatedPages">Новый массив страниц</param>
   */
  const handleUpdatePages = (updatedPages: Page[]) => {
    if (!survey || !currentVersion) return;
    
    if (updatedPages.length === 0) {
      toast.error('Должна быть хотя бы одна страница');
      return;
    }

    if (selectedPageId && !updatedPages.find(p => p.id === selectedPageId)) {
      setSelectedPageId(updatedPages[0].id);
    }

    updateSurveyVersion({
      pages: updatedPages.map(normalizePage)
    });
  };

  /**
   * <summary>
   * Удаляет страницу и все связанные вопросы.
   * </summary>
   * <param name="pageId">ID страницы для удаления</param>
   */
  const handleDeletePage = (pageId: string, questions: Question[]) => {
    if (!survey || !currentVersion || !pages) return;
    
    if (pages.length <= 1) {
      // Не даём удалить последнюю страницу
      return;
    }
    
    // Удаляем все вопросы со страницы
    const questionsToDelete = questions.filter(q => q.pageId === pageId).map(q => q.id);
    const updatedQuestions = questions.filter(q => q.pageId !== pageId);
    
    const updatedPages = pages.filter(p => p.id !== pageId);
    
    updateSurveyVersion({
      questions: updatedQuestions,
      pages: updatedPages.map(normalizePage)
    });
    
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id);
    }
    
    // Сбрасываем выделение если удаленный вопрос был выделен
    if (questionsToDelete.includes(selectedQuestionId || '')) {
      setSelectedQuestionId(undefined);
    }
  };

  /**
   * <summary>
   * Обновляет название страницы.
   * </summary>
   */
  const handleUpdatePageTitle = (pageId: string, newTitle: string) => {
    if (!pages) return;
    
    const updatedPages = pages.map(page =>
      page.id === pageId ? { ...page, title: newTitle } : page
    );
    handleUpdatePages(updatedPages);
  };

  /**
   * <summary>
   * Обновляет описание страницы и позицию описания.
   * </summary>
   */
  const handleUpdatePageDescription = (pageId: string, newDescription: string, position: string) => {
    if (!pages) return;
    
    const updatedPages = pages.map(p =>
      p.id === pageId 
        ? normalizePage({ ...p, description: newDescription, descriptionPosition: position }) 
        : normalizePage(p)
    );
    
    updateSurveyVersion({
      pages: updatedPages
    });
  };

  return {
    // Core update function
    updateSurveyVersion,
    
    // Page operations
    handleUpdatePages,
    handleDeletePage,
    handleUpdatePageTitle,
    handleUpdatePageDescription,
  };
} 