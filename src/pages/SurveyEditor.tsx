import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyStore } from '@/store/survey-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Question, QuestionType, Page } from '@/types/survey';
import VisualEditor from '@/components/survey-editor/VisualEditor';
import { toast } from 'sonner';
import { SurveyPreview } from '@/components/survey-preview/SurveyPreview';
import { ReactFlowProvider } from '@xyflow/react';
import { PageManager } from '@/components/survey-editor/PageManager';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarTabs,
  SidebarTab,
  SidebarTabsContent,
  SidebarTabsList
} from "@/components/ui/sidebar";
import { SidebarTreeView } from '@/components/survey-editor/SidebarTreeView';
import { Card } from '@/components/ui/card';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
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
  }
  return {
    ...p,
    ...(descPos ? { descriptionPosition: descPos } : {}),
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
   * </summary>
   * <param name="qid">ID вопроса для удаления</param>
   */
  function handleDeleteQuestion(qid: string) {
    const updatedQuestions = questions.filter(q => q.id !== qid);
    
    updateSurvey({
      ...survey,
      versions: survey.versions.map(v => 
        v.version === survey.currentVersion 
          ? { ...v, questions: updatedQuestions }
          : v
      )
    });
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

    // Обновляем только нужные страницы
    const updatedPages = currentVersion.pages.map(page => normalizePage({
      ...page,
      questions: allQuestions.filter(q => q.pageId === page.id)
    }));

    const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());

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
   * </summary>
   */
  function handleAddQuestion() {
    if (pages.length === 0) {
      toast.error('Создайте хотя бы одну страницу перед добавлением вопроса');
      return;
    }

    const targetPageId = selectedPageId || pages[0].id;
    const pageQuestions = questions.filter(q => q.pageId === targetPageId);

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
      type: QuestionType.Text,
      required: false,
      position: { x: 250, y: pageQuestions.length * 150 },
      options: undefined
    };

    // Если тип вопроса — Radio, Checkbox или Select, сразу добавляем два варианта
    if ([QuestionType.Radio, QuestionType.Checkbox, QuestionType.Select].includes(newQuestion.type)) {
      newQuestion.options = [
        { id: crypto.randomUUID(), text: 'Вариант 1' },
        { id: crypto.randomUUID(), text: 'Вариант 2' }
      ];
    }

    const updatedQuestions = [...questions, newQuestion];
    handleUpdateQuestions(updatedQuestions);
  }

  /**
   * <summary>
   * Открывает предпросмотр опроса, если есть хотя бы один вопрос.
   * </summary>
   */
  function handlePreviewClick() {
    if (questions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос для предпросмотра');
      return;
    }
    setPendingPreview(true);
  }

  const currentPageQuestions = questions.filter(q => q.pageId === selectedPageId);

  function handleTreeMove(oldIndex: number, index: number, parent?: Page) {
    console.log('handleTreeMove', { oldIndex, index, parent, selectedPageId, questions });
    if (!selectedPageId) return;
    const pageQuestions = questions.filter(q => q.pageId === selectedPageId);
    if (oldIndex < 0 || oldIndex >= pageQuestions.length) return;
    const removedQuestion = pageQuestions[oldIndex];
    const newPageId = parent ? (parent as any).data?.id || parent.id : undefined;
    const newQuestions = questions.filter(q => q.id !== removedQuestion.id);
    const updatedQuestion: Question = { ...removedQuestion, pageId: newPageId };
    const questionsInTargetPage = newQuestions.filter(q => q.pageId === newPageId);
    const insertIndex = (() => {
      if (index < 0 || index >= questionsInTargetPage.length) return -1;
      const targetQuestion = questionsInTargetPage[index];
      return newQuestions.findIndex(q => q.id === targetQuestion.id);
    })();
    if (insertIndex === -1) {
      newQuestions.push(updatedQuestion);
    } else {
      newQuestions.splice(insertIndex, 0, updatedQuestion);
    }
    console.log('handleTreeMove result', { newQuestions });
    handleUpdateQuestions(newQuestions);
  }

  // Функция для удаления страницы
  function handleDeletePage(pageId: string) {
    if (pages.length <= 1) {
      // Не даём удалить последнюю страницу
      return;
    }
    const updatedPages = pages.filter(p => p.id !== pageId);
    handleUpdatePages(updatedPages);
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id);
    }
  }

  /**
   * <summary>
   * Дерево страниц и вопросов с drag-and-drop и редактированием названий.
   * </summary>
   */
  function SimplePageTree({ pages, questions, selectedPageId, selectedQuestionId, onSelectPage, onSelectQuestion, onMovePage, handleDeletePage }) {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
      })
    );
    const [activePageId, setActivePageId] = React.useState(null);
    const [editingPageId, setEditingPageId] = React.useState(null);
    const [editingTitle, setEditingTitle] = React.useState("");
    
    const handleTitleClick = (e, page) => {
      e.stopPropagation();
      setEditingPageId(page.id);
      setEditingTitle(page.title);
    };

    const handleTitleChange = (e) => {
      setEditingTitle(e.target.value);
    };

    const handleTitleSave = (pageId) => {
      if (editingTitle.trim()) {
        const updatedPages = pages.map(p =>
          p.id === pageId ? { ...p, title: editingTitle.trim() } : p
        );
        onMovePage(updatedPages);
      }
      setEditingPageId(null);
    };

    const handleKeyDown = (e, pageId) => {
      if (e.key === 'Enter') {
        handleTitleSave(pageId);
      } else if (e.key === 'Escape') {
        setEditingPageId(null);
      }
    };

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={event => {
          setActivePageId(event.active.id);
        }}
        onDragEnd={event => {
          setActivePageId(null);
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const oldIndex = pages.findIndex(p => p.id === active.id);
          const newIndex = pages.findIndex(p => p.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            const newPages = [...pages];
            const [removed] = newPages.splice(oldIndex, 1);
            newPages.splice(newIndex, 0, removed);
            onMovePage(newPages);
          }
        }}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 px-4">
            {pages.map(page => (
              <div key={page.id} className="relative group">
                <Card
                  className={
                    (page.id === selectedPageId
                      ? 'border-primary '
                      : 'hover:border-primary/50 ') +
                    'transition-all cursor-pointer p-0'
                  }
                  onClick={() => onSelectPage(page.id)}
                >
                  <div className="px-4 py-2 font-bold text-base flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="cursor-grab shrink-0">≡</span>
                      {editingPageId === page.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={handleTitleChange}
                          onBlur={() => handleTitleSave(page.id)}
                          onKeyDown={(e) => handleKeyDown(e, page.id)}
                          className="flex-1 px-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span 
                          onClick={(e) => handleTitleClick(e, page)}
                          className="flex-1 cursor-text hover:bg-gray-100 px-1 rounded truncate block overflow-hidden text-ellipsis"
                          style={{ maxWidth: 'calc(100% - 24px)' }}
                          title={page.title}
                        >
                          {page.title}
                        </span>
                      )}
                    </div>
                    <button
                      className="opacity-60 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-600 shrink-0"
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm('Удалить страницу?')) {
                          handleDeletePage(page.id);
                        }
                      }}
                      title="Удалить страницу"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="pl-4 pr-2 pb-2 flex flex-col gap-1">
                    {questions.filter(q => q.pageId === page.id).map(q => (
                      <div
                        key={q.id}
                        className={
                          (q.id === selectedQuestionId
                            ? 'bg-blue-100 border border-blue-400 font-semibold '
                            : 'hover:bg-gray-50 border border-transparent ') +
                          'rounded px-3 py-1 text-sm text-gray-700 transition flex items-center relative'
                        }
                        style={{ marginLeft: '0' }}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectQuestion(q.id);
                        }}
                      >
                        <span className="block w-1 h-5 bg-gray-300 rounded-full absolute left-4 top-1/2 -translate-y-1/2" />
                        <span className="ml-4">{q.title || 'Без названия'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activePageId ? (
            <Card className="transition-all cursor-pointer p-0 w-full max-w-[95%]">
              <div className="px-4 py-2 font-bold text-base flex items-center gap-2">
                <span className="cursor-grab">≡</span>
                {pages.find(p => p.id === activePageId)?.title}
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  /**
   * <summary>
   * Карточка страницы с drag-and-drop для сортировки.
   * </summary>
   */
  function DraggablePageCard({ page, selected, onClick, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: page.id,
    });
    const style = transform ? {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: 10,
    } : undefined;
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={
          (selected
            ? 'border-primary '
            : 'hover:border-primary/50 ') +
          (isDragging ? 'opacity-60 shadow-lg ' : '') +
          'transition-all cursor-pointer p-0'
        }
        onClick={onClick}
        {...attributes}
        {...listeners}
      >
        <div className="px-4 py-2 font-bold text-base flex items-center gap-2">
          <span className="cursor-grab">≡</span>
          {page.title}
        </div>
        {children}
      </Card>
    );
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
    if (questions.some(q => q.type === QuestionType.Resolution)) {
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
      type: QuestionType.Resolution,
      required: false,
      position: { x: 400, y: 100 },
      resolutionRules: [],
      defaultResolution: 'Результат по умолчанию',
    };
    handleUpdateQuestions([...questions, newResolution]);
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
                  pq => pq.type === QuestionType.ParallelGroup && Array.isArray(pq.parallelQuestions) && pq.parallelQuestions.includes(questionId)
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
            questions={currentPageQuestions}
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
