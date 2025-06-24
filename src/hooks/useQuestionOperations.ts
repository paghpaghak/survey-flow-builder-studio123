import { toast } from 'sonner';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Question, Page } from '@survey-platform/shared-types';
import { normalizePage } from './useSurveyEditor';

interface UseQuestionOperationsProps {
  questions: Question[];
  pages: Page[];
  currentVersion: any;
  selectedPageId?: string;
  setSelectedQuestionId: (id: string | undefined) => void;
  setPendingPreview: (pending: boolean) => void;
  updateSurveyVersion: (updates: any) => void;
}

/**
 * <summary>
 * Хук для операций с вопросами: создание, обновление, удаление.
 * Инкапсулирует бизнес-логику работы с вопросами и их валидацию.
 * </summary>
 */
export function useQuestionOperations({
  questions,
  pages,
  currentVersion,
  selectedPageId,
  setSelectedQuestionId,
  setPendingPreview,
  updateSurveyVersion
}: UseQuestionOperationsProps) {

  /**
   * <summary>
   * Обновляет вопросы для выбранной страницы, исключая дубликаты по id.
   * </summary>
   * <param name="updatedQuestions">Массив вопросов для текущей страницы</param>
   */
  const handleUpdateQuestions = (updatedQuestions: Question[]) => {
    if (!currentVersion || !questions) return;
    
    // Оставляем вопросы других страниц без изменений
    const otherQuestions = questions.filter(q => !updatedQuestions.some(uq => uq.id === q.id));
    const allQuestions = [...otherQuestions, ...updatedQuestions];
    console.log('[SurveyEditor] otherQuestions:', otherQuestions.length);
    console.log('[SurveyEditor] allQuestions после объединения:', allQuestions.length);
    
    // Обновляем только нужные страницы
    const updatedPages = (currentVersion.pages || []).map((page: any) => normalizePage({
      ...page,
      questions: allQuestions.filter(q => q.pageId === page.id)
    }));

    const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());
    console.log('[SurveyEditor] uniqueQuestions финальные:', uniqueQuestions.length);

    updateSurveyVersion({
      questions: uniqueQuestions,
      pages: updatedPages
    });
  };

  /**
   * <summary>
   * Удаляет вопрос по id из текущей версии опроса.
   * Включает удаление вложенных вопросов из параллельных групп.
   * </summary>
   * <param name="qid">ID вопроса для удаления</param>
   */
  const handleDeleteQuestion = (qid: string) => {
    if (!questions) return;
    
    const questionToDelete = questions.find(q => q.id === qid);
    let questionsToDelete = [qid];

    // Если удаляется параллельная группа, добавляем все вложенные вопросы
    if (questionToDelete?.type === QUESTION_TYPES.ParallelGroup && questionToDelete.parallelQuestions) {
      questionsToDelete = [...questionsToDelete, ...questionToDelete.parallelQuestions];
    }

    // Удаляем все связанные вопросы
    const updatedQuestions = questions.filter(q => !questionsToDelete.includes(q.id));
    
    // Также удаляем все transitionRules, которые ссылаются на удаляемые вопросы
    const cleanedQuestions = updatedQuestions.map(q => ({
      ...q,
      transitionRules: q.transitionRules?.filter(rule => !questionsToDelete.includes(rule.nextQuestionId))
    }));
    
    updateSurveyVersion({
      questions: cleanedQuestions
    });

    // Сбрасываем выделение если удаленный вопрос был выделен
    if (questionsToDelete.includes(qid)) {
      setSelectedQuestionId(undefined);
    }
  };

  /**
   * <summary>
   * Добавляет новый вопрос на выбранную страницу.
   * Автоматически исключает вложенные вопросы параллельных групп из визуального редактора.
   * </summary>
   */
  const handleAddQuestion = () => {
    if (!pages || !questions) return;
    
    if (pages.length === 0) {
      toast.error('Создайте хотя бы одну страницу перед добавлением вопроса');
      return;
    }

    const targetPageId = selectedPageId || pages[0].id;
    
    // Фильтруем вопросы, исключая вложенные в параллельные группы
    const allParallelQuestionIds = new Set<string>();
    questions.forEach(q => {
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions) {
        q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
      }
    });
    
    const pageQuestions = questions.filter(q => 
      q.pageId === targetPageId && !allParallelQuestionIds.has(q.id)
    );

    // Определяем номер для нового вопроса на этой странице
    const nextNumber = pageQuestions.length + 1;

    // Проверяем, что id уникален
    let newId = crypto.randomUUID();
    while (questions.some(q => q.id === newId)) {
      newId = crypto.randomUUID();
    }

    const newQuestion: Question = {
      id: newId,
      pageId: targetPageId,
      title: `Новый вопрос ${nextNumber}`,
      type: QUESTION_TYPES.Text,
      required: false,
      position: { x: 250, y: pageQuestions.length * 150 },
      options: undefined
    };

    // Если тип вопроса — Radio, Checkbox или Select, сразу добавляем два варианта
    if ([QUESTION_TYPES.Radio, QUESTION_TYPES.Checkbox, QUESTION_TYPES.Select].includes(newQuestion.type)) {
      newQuestion.options = [
        { id: crypto.randomUUID(), text: 'Вариант 1' },
        { id: crypto.randomUUID(), text: 'Вариант 2' }
      ];
    }

    const updatedQuestions = [...questions, newQuestion];
    handleUpdateQuestions(updatedQuestions);
    
    // Выделяем новый вопрос
    setSelectedQuestionId(newQuestion.id);
  };

  /**
   * <summary>
   * Обновляет название вопроса.
   * </summary>
   */
  const handleUpdateQuestionTitle = (questionId: string, newTitle: string) => {
    if (!questions) return;
    
    const updatedQuestions = questions.map(q =>
      q.id === questionId ? { ...q, title: newTitle } : q
    );
    handleUpdateQuestions(updatedQuestions);
  };

  /**
   * <summary>
   * Обновляет порядок вопросов.
   * </summary>
   */
  const handleQuestionOrderChange = (newQuestions: Question[]) => {
    handleUpdateQuestions(newQuestions);
  };

  /**
   * <summary>
   * Добавляет резолюцию в опрос.
   * </summary>
   */
  const handleAddResolution = () => {
    if (!questions || !pages) return;
    
    if (questions.some(q => q.type === QUESTION_TYPES.Resolution)) {
      toast.error('В опросе может быть только одна резолюция');
      return;
    }
    if (pages.length === 0) {
      toast.error('Создайте хотя бы одну страницу перед добавлением резолюции');
      return;
    }
    
    const lastPageId = pages[pages.length - 1].id;
    let newId = crypto.randomUUID();
    while (questions.some(q => q.id === newId)) {
      newId = crypto.randomUUID();
    }
    
    const newResolution: Question = {
      id: newId,
      pageId: lastPageId,
      title: 'Резолюция',
      type: QUESTION_TYPES.Resolution,
      required: false,
      position: { x: 400, y: 100 },
      resolutionRules: [],
      defaultResolution: 'Результат по умолчанию',
    };
    
    handleUpdateQuestions([...questions, newResolution]);
    setSelectedQuestionId(newResolution.id);
  };

  /**
   * <summary>
   * Открывает предпросмотр опроса, если есть хотя бы один вопрос.
   * </summary>
   */
  const handlePreviewClick = () => {
    if (!questions) return;
    
    // Проверяем количество основных вопросов (исключая вложенные в параллельные группы)
    const allParallelQuestionIds = new Set<string>();
    questions.forEach(q => {
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions) {
        q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
      }
    });
    
    const mainQuestions = questions.filter(q => !allParallelQuestionIds.has(q.id));
    
    if (mainQuestions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос для предпросмотра');
      return;
    }
    setPendingPreview(true);
  };

  return {
    // Core question operations
    handleUpdateQuestions,
    handleDeleteQuestion,
    handleAddQuestion,
    handleUpdateQuestionTitle,
    handleQuestionOrderChange,
    
    // Special question types
    handleAddResolution,
    
    // UI actions
    handlePreviewClick,
  };
} 