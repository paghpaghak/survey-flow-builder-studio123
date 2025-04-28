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

export default function SurveyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { surveys, updateSurvey, loadSurveys } = useSurveyStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | undefined>();

  const survey = surveys.find(s => s.id === id);
  const currentVersion = survey?.versions.find(v => v.version === survey.currentVersion);
  const questions = currentVersion?.questions || [];
  const pages = currentVersion?.pages || [];

  useEffect(() => {
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  useEffect(() => {
    if (id && !survey) {
      loadSurveys().then(() => {
        const allSurveys = useSurveyStore.getState().surveys;
        console.log('Surveys after load:', allSurveys);
        console.log('Ищу id:', id);
        const found = allSurveys.find(s => s.id === id);
        console.log('Найденный опрос:', found);
      });
    }
  }, [id, survey, loadSurveys]);

  useEffect(() => {
    console.log('selectedPageId:', selectedPageId);
    console.log('currentPageQuestions:', questions.filter(q => !selectedPageId || q.pageId === selectedPageId));
    console.log('pages:', pages.map(p => p.id));
    console.log('questions:', questions.map(q => ({id: q.id, pageId: q.pageId})));
  }, [selectedPageId, questions, pages]);

  if (!survey || !currentVersion) {
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
    toast.success('Вопрос удалён');
  }

  function handleUpdateQuestions(updatedQuestions: Question[]) {
    const updatedVersion = {
      ...currentVersion,
      questions: updatedQuestions,
      updatedAt: new Date()
    };

    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date()
    };

    updateSurvey(updatedSurvey);
  }

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
      pages: updatedPages,
      updatedAt: new Date()
    };

    const updatedSurvey = {
      ...survey,
      versions: survey.versions.map(v =>
        v.version === survey.currentVersion ? updatedVersion : v
      ),
      updatedAt: new Date()
    };

    updateSurvey(updatedSurvey);
  }

  function handleAddQuestion() {
    if (pages.length === 0) {
      toast.error('Создайте хотя бы одну страницу перед добавлением вопроса');
      return;
    }

    const targetPageId = selectedPageId || pages[0].id;
    const pageQuestions = questions.filter(q => q.pageId === targetPageId);

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      pageId: targetPageId,
      title: 'Новый вопрос',
      type: QuestionType.Text,
      required: false,
      position: { x: 250, y: pageQuestions.length * 150 }
    };

    const updatedQuestions = [...questions, newQuestion];
    handleUpdateQuestions(updatedQuestions);
  }

  function handlePreviewClick() {
    if (questions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос для предпросмотра');
      return;
    }
    setIsPreviewOpen(true);
  }

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.Text:
        return "Текст";
      case QuestionType.Radio:
        return "Один из списка";
      case QuestionType.Checkbox:
        return "Несколько из списка";
      case QuestionType.Select:
        return "Выпадающий список";
      case QuestionType.Date:
        return "Дата";
      case QuestionType.Email:
        return "Email";
      case QuestionType.Phone:
        return "Телефон";
    }
  };

  const currentPageQuestions = questions.filter(q => !selectedPageId || q.pageId === selectedPageId);
  console.log('Текущая выбранная страница:', selectedPageId);

  function handleTreeMove(nodes, parent, index) {
    if (!nodes.length) return;
    const node = nodes[0];
    const data = node.data;
    if (data.type === 'page') {
      const oldIndex = pages.findIndex(p => p.id === data.id);
      if (oldIndex === -1) return;
      const newPages = [...pages];
      const [removed] = newPages.splice(oldIndex, 1);
      newPages.splice(index, 0, removed);
      handleUpdatePages(newPages);
    } else if (data.type === 'question') {
      const oldIndex = questions.findIndex(q => q.id === data.id);
      if (oldIndex === -1) return;
      const newQuestions = [...questions];
      const [removed] = newQuestions.splice(oldIndex, 1);
      const newPageId = parent ? parent.data.id : undefined;
      removed.pageId = newPageId;
      const pageQuestions = newQuestions.filter(q => q.pageId === newPageId);
      const insertIndex = newQuestions.findIndex((q, i) => q.pageId === newPageId && pageQuestions.indexOf(q) === index);
      if (insertIndex === -1) {
        newQuestions.push(removed);
      } else {
        newQuestions.splice(insertIndex, 0, removed);
      }
      handleUpdateQuestions(newQuestions);
    }
  }

  function handleDeletePage(pageId) {
    if (pages.length <= 1) {
      toast.error('Нельзя удалить единственную страницу опроса');
      return;
    }
    const updatedPages = pages.filter(p => p.id !== pageId);
    handleUpdatePages(updatedPages);
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id);
    }
  }

  function SimplePageTree({ pages, questions, selectedPageId, selectedQuestionId, onSelectPage, onSelectQuestion, onMovePage, handleDeletePage }) {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
      })
    );
    const [activePageId, setActivePageId] = React.useState(null);

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
          <div className="flex flex-col gap-3">
            {pages.map(page => (
              <div key={page.id} className="relative group">
                <Card
                  className={
                    (page.id === selectedPageId
                      ? 'border-primary ring-2 ring-primary/30 '
                      : 'hover:border-primary/50 ') +
                    'transition-all cursor-pointer p-0'
                  }
                  onClick={() => onSelectPage(page.id)}
                >
                  <div className="px-4 py-2 font-bold text-base flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="cursor-grab">≡</span>
                      {page.title}
                    </div>
                    <button
                      className="opacity-60 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-600"
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
                  <div className="pl-6 pr-2 pb-2 flex flex-col gap-1">
                    {questions.filter(q => q.pageId === page.id).map(q => (
                      <div
                        key={q.id}
                        className={
                          (q.id === selectedQuestionId
                            ? 'bg-blue-100 border border-blue-400 font-semibold '
                            : 'hover:bg-gray-50 border border-transparent ') +
                          'rounded px-3 py-1 text-sm text-gray-700 transition flex items-center relative'
                        }
                        style={{ marginLeft: '-1.25rem' }}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectQuestion(q.id);
                        }}
                      >
                        <span className="block w-1 h-5 bg-gray-300 rounded-full absolute left-0 top-1/2 -translate-y-1/2" />
                        <span className="ml-3">{q.title || 'Без названия'}</span>
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
            ? 'border-primary ring-2 ring-primary/30 '
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
            style={{ maxWidth: 'calc(100% - 48px)' }}
            title={survey.title}
          >
            {survey.title}
          </span>
        </div>
        <div className="text-gray-500 px-4 pb-2">{survey.description}</div>
        <div className="flex justify-between gap-2 my-6 px-4">
          <Button className="w-20 h-12 text-lg" variant="outline" size="icon" onClick={handlePreviewClick}>
            <Eye className="h-5 w-5" />
          </Button>
          <Button className="w-20 h-12 text-lg" size="icon" onClick={handleAddQuestion} disabled={!selectedPageId}>
            <span title="Добавить вопрос">+</span>
          </Button>
          <Button className="w-20 h-12 text-lg" size="icon" onClick={() => {
            const newPage = {
              id: crypto.randomUUID(),
              title: `Страница ${pages.length + 1}`,
              questions: []
            };
            handleUpdatePages([...pages, newPage]);
            setSelectedPageId(newPage.id);
          }}>
            <span title="Добавить страницу">📄</span>
          </Button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SimplePageTree
              pages={pages}
              questions={questions}
              selectedPageId={selectedPageId}
              selectedQuestionId={selectedQuestionId}
              onSelectPage={(id) => {
                setSelectedPageId(id);
                setSelectedQuestionId(undefined);
              }}
              onSelectQuestion={(id) => {
                setSelectedQuestionId(id);
              }}
              onMovePage={handleUpdatePages}
              handleDeletePage={handleDeletePage}
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
          />
        </ReactFlowProvider>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
    </div>
  );
}
