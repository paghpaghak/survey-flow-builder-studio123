import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyStore } from "../store/survey-store";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Question, Page, QUESTION_TYPES } from '@/types/survey';
import type { QuestionType } from '@/types/survey';
import VisualEditor from '@/components/survey-editor/VisualEditor';
import { toast } from 'sonner';
import { SurveyPreview } from '@/components/survey-preview/SurveyPreview';
import { ReactFlowProvider } from '@xyflow/react';
import { SidebarTreeView } from '@/components/survey-editor/SidebarTreeView';
import ResolutionEditDialog from '@/components/survey-editor/ResolutionEditDialog';

/**
 * <summary>
 * Страница редактора опроса. Позволяет создавать, редактировать и структурировать страницы и вопросы опроса.
 * Использует Zustand для хранения состояния, поддерживает drag-and-drop, предпросмотр и визуальное редактирование.
 * </summary>
 */

function normalizePage(p: any): Page {
  let descPos: 'before' | 'after' | undefined = undefined;
  if (p.descriptionPosition === 'before' || p.descriptionPosition === 'after') {
    descPos = p.descriptionPosition;
  } else {
    descPos = 'before'; // ← Добавить эту строку
  }
  return {
    ...p,
    descriptionPosition: descPos,
  };
}

function SurveyNotFound({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  console.log('SurveyNotFound rendered');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <Button variant="ghost" className="gap-1" onClick={() => navigate('/')}> 
          <ArrowLeft className="h-4 w-4" /> Назад к опросам
        </Button>
      </div>
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Опрос не найден</h2>
        <p className="text-gray-500 mb-4">Опрос, который вы ищете, не существует или был удалён.</p>
        <Button onClick={() => navigate('/')}>Вернуться к списку опросов</Button>
      </div>
    </div>
  );
}

export default function SurveyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { surveys, updateSurvey, loadSurveys } = useSurveyStore();
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

  // Теперь return с условием после всех хуков
  if (!survey || !currentVersion) {
    console.log('SurveyEditor: survey or currentVersion not found, rendering SurveyNotFound');
    return <SurveyNotFound navigate={navigate} />;
  }

  /**
   * <summary>
   * Удаляет вопрос по id из текущей версии опроса.
   * Включает удаление вложенных вопросов из параллельных групп.
   * </summary>
   * <param name="qid">ID вопроса для удаления</param>
   */
  function handleDeleteQuestion(qid: string) {
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
    
    updateSurvey({
      ...survey,
      versions: survey.versions.map(v => 
        v.version === survey.currentVersion 
          ? { ...v, questions: cleanedQuestions }
          : v
      )
    });

    // Сбрасываем выделение если удаленный вопрос был выделен
    if (questionsToDelete.includes(selectedQuestionId || '')) {
      setSelectedQuestionId(undefined);
    }
  }

  /**
   * <summary>
   * Обновляет вопросы для выбранной страницы, исключая дубликаты по id.
   * </summary>
   * <param name="updatedQuestions">Массив вопросов для текущей страницы</param>
   */
  function handleUpdateQuestions(updatedQuestions: Question[]) {
    // Оставляем вопросы других страниц без изменений
    const otherQuestions = questions.filter(q => !updatedQuestions.some(uq => uq.id === q.id));
    const allQuestions = [...otherQuestions, ...updatedQuestions];
    console.log('[SurveyEditor] otherQuestions:', otherQuestions.length);
    console.log('[SurveyEditor] allQuestions после объединения:', allQuestions.length);
    // Обновляем только нужные страницы
    const updatedPages = currentVersion.pages.map(page => normalizePage({
      ...page,
      questions: allQuestions.filter(q => q.pageId === page.id)
    }));

    const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());
    console.log('[SurveyEditor] uniqueQuestions финальные:', uniqueQuestions.length);

    const updatedVersion = {
      ...currentVersion,
      questions: uniqueQuestions,
      pages: updatedPages,
      updatedAt: new Date().toISOString()
    };

    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date().toISOString()
    };

    updateSurvey(updatedSurvey);
  }

  /**
   * <summary>
   * Обновляет список страниц опроса.
   * </summary>
   * <param name="updatedPages">Новый массив страниц</param>
   */
  function handleUpdatePages(updatedPages: Page[]) {
    if (updatedPages.length === 0) {
      toast.error('Должна быть хотя бы одна страница');
      return;
    }

    if (selectedPageId && !updatedPages.find(p => p.id === selectedPageId)) {
      setSelectedPageId(updatedPages[0].id);
    }

    const updatedVersion = {
      ...currentVersion,
      pages: updatedPages.map(normalizePage),
      updatedAt: new Date().toISOString()
    };

    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date().toISOString()
    };

    updateSurvey(updatedSurvey);
  }

  /**
   * <summary>
   * Добавляет новый вопрос на выбранную страницу.
   * Автоматически исключает вложенные вопросы параллельных групп из визуального редактора.
   * </summary>
   */
  function handleAddQuestion() {
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
  }

  /**
   * <summary>
   * Открывает предпросмотр опроса, если есть хотя бы один вопрос.
   * </summary>
   */
  function handlePreviewClick() {
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
  }

  // Функция для удаления страницы
  function handleDeletePage(pageId: string) {
    if (pages.length <= 1) {
      // Не даём удалить последнюю страницу
      return;
    }
    
    // Удаляем все вопросы со страницы
    const questionsToDelete = questions.filter(q => q.pageId === pageId).map(q => q.id);
    const updatedQuestions = questions.filter(q => q.pageId !== pageId);
    
    const updatedPages = pages.filter(p => p.id !== pageId);
    
    // Обновляем survey с удаленными вопросами и страницей
    const updatedVersion = {
      ...currentVersion,
      questions: updatedQuestions,
      pages: updatedPages.map(normalizePage),
      updatedAt: new Date().toISOString()
    };

    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date().toISOString()
    };

    updateSurvey(updatedSurvey);
    
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id);
    }
    
    // Сбрасываем выделение если удаленный вопрос был выделен
    if (questionsToDelete.includes(selectedQuestionId || '')) {
      setSelectedQuestionId(undefined);
    }
  }

  const handleQuestionOrderChange = (newQuestions: Question[]) => {
    handleUpdateQuestions(newQuestions);
  };

  // Функция для обновления названия страницы
  function handleUpdatePageTitle(pageId: string, newTitle: string) {
    const updatedPages = pages.map(page =>
      page.id === pageId ? { ...page, title: newTitle } : page
    );
    handleUpdatePages(updatedPages);
  }

  // Функция для обновления названия вопроса
  function handleUpdateQuestionTitle(questionId: string, newTitle: string) {
    const updatedQuestions = questions.map(q =>
      q.id === questionId ? { ...q, title: newTitle } : q
    );
    handleUpdateQuestions(updatedQuestions);
  }

  function handleUpdatePageDescription(pageId: string, newDescription: string, position: string) {
    const updatedPages = pages.map(p =>
      p.id === pageId ? normalizePage({ ...p, description: newDescription, descriptionPosition: position }) : normalizePage(p)
    );
    const updatedVersion = {
      ...currentVersion,
      pages: updatedPages,
      updatedAt: new Date().toISOString()
    };
    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date().toISOString()
    };
    updateSurvey(updatedSurvey);
  }

  function handleAddResolution() {
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
    const newResolution = {
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
  }

  return (
    <div className="flex h-screen w-full">
      <div className="w-[340px] h-screen flex flex-col bg-gray-50 border-r min-h-0">
        <div className="flex items-center gap-2 p-4 border-b">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
            tabIndex={0}
            aria-label="К опросам"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span
            className="ml-2 text-2xl font-bold truncate whitespace-nowrap overflow-hidden text-ellipsis block"
            style={{ maxWidth: 'calc(100% - 64px)' }}
            title={survey.title}
          >
            {survey.title}
          </span>
        </div>
        <div className="text-gray-500 px-4">{survey.description}</div>
        <div className="flex justify-between gap-2 my-6 px-4" style={{ marginBottom: '12px', marginTop: '12px' }}>
          <Button className="w-[90px] h-10 text-lg" variant="outline" size="icon" onClick={handlePreviewClick} data-testid="preview-btn">
            <Eye className="h-5 w-5" />
          </Button>
          <Button className="w-[90px] h-10 text-lg" size="icon" onClick={handleAddQuestion} disabled={!selectedPageId} data-testid="add-question-btn">
            <span title="Добавить вопрос">+</span>
          </Button>
          <Button className="w-[90px] h-10 text-lg" size="icon" onClick={() => {
            const newPage = {
              id: crypto.randomUUID(),
              title: `Страница ${pages.length + 1}`,
              questions: []
            };
            handleUpdatePages([...pages, newPage]);
            setSelectedPageId(newPage.id);
          }} data-testid="add-page-btn">
            <span title="Добавить страницу">📄</span>
          </Button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SidebarTreeView
              pages={pages}
              questions={questions}
              selectedPageId={selectedPageId}
              selectedQuestionId={selectedQuestionId}
              onSelectPage={(id) => {
                setSelectedPageId(id);
                setSelectedQuestionId(undefined);
              }}
              onSelectQuestion={questionId => {
                const q = questions.find(q => q.id === questionId);
                if (!q) return;
                // Если вопрос не на текущей странице — переключаем страницу
                if (q.pageId !== selectedPageId) {
                  setSelectedPageId(q.pageId);
                }
                // Если вопрос вложенный в параллельную ветку — выделяем ветку
                const parentParallel = questions.find(
                  pq => pq.type === QUESTION_TYPES.ParallelGroup && Array.isArray(pq.parallelQuestions) && pq.parallelQuestions.includes(questionId)
                );
                if (parentParallel) {
                  setSelectedQuestionId(parentParallel.id);
                } else {
                  setSelectedQuestionId(questionId);
                }
              }}
              onQuestionOrderChange={handleQuestionOrderChange}
              onUpdatePageTitle={handleUpdatePageTitle}
              onUpdateQuestionTitle={handleUpdateQuestionTitle}
              onDeleteQuestion={handleDeleteQuestion}
              onDeletePage={handleDeletePage}
              onUpdatePageDescription={handleUpdatePageDescription}
              onAddResolution={handleAddResolution}
              onEditResolution={q => setEditingResolution(q)}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 h-screen">
        <ReactFlowProvider>
          <VisualEditor
            questions={questions.filter(q => q.pageId === selectedPageId)}
            onUpdateQuestions={handleUpdateQuestions}
            pages={pages}
            selectedQuestionId={selectedQuestionId}
            setSelectedQuestionId={setSelectedQuestionId}
            allQuestions={questions}
          />
        </ReactFlowProvider>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="survey-preview-modal">
          <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">Предпросмотр опроса</h2>
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>✕</Button>
            </div>
            <SurveyPreview
              questions={questions}
              pages={pages}
              onClose={() => setIsPreviewOpen(false)}
            />
          </div>
        </div>
      )}

      {editingResolution && (
        <ResolutionEditDialog
          resolutionQuestion={editingResolution}
          questions={questions}
          open={!!editingResolution}
          onSave={updated => {
            const updatedQuestions = questions.map(q => q.id === updated.id ? updated : q);
            handleUpdateQuestions(updatedQuestions);
          }}
          onClose={() => setEditingResolution(null)}
        />
      )}
    </div>
  );
}