import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyStore } from '@/store/survey-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
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

export default function SurveyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { surveys, updateSurvey, loadSurveys } = useSurveyStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'pages'>('questions');
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();

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
      setActiveTab('pages');
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

  const currentPageQuestions = questions.filter(q => 
    !selectedPageId || q.pageId === selectedPageId
  );

  return (
    <div className="flex min-h-screen w-full">
      <SidebarProvider>
        <div className="flex w-full"> 
          <Sidebar className="w-[340px] bg-gray-50 border-r h-full flex flex-col">
            <SidebarHeader>
              <div className="mb-2">
                <h1 className="text-2xl font-bold">{survey.title}</h1>
                <div className="text-gray-500">{survey.description}</div>
              </div>
            </SidebarHeader>

            <SidebarTabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'questions' | 'pages')}>
              <SidebarTabsList>
                <SidebarTab value="questions">Вопросы</SidebarTab>
                <SidebarTab value="pages">Страницы</SidebarTab>
              </SidebarTabsList>

              <SidebarTabsContent value="questions">
                <SidebarContent className="flex-1">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      {currentPageQuestions.length === 0 ? (
                        <div className="text-gray-400 px-2 py-6 text-center">
                          Пока нет вопросов.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {currentPageQuestions.map((q, idx) => (
                            <div key={q.id} className="flex items-center justify-between w-full bg-white p-2 rounded">
                              <div>
                                <div className="font-medium">{q.title}</div>
                                <div className="text-sm text-gray-500">{getQuestionTypeLabel(q.type)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </SidebarTabsContent>

              <SidebarTabsContent value="pages">
                <SidebarContent>
                  <PageManager
                    pages={pages}
                    onUpdatePages={handleUpdatePages}
                    onSelectPage={setSelectedPageId}
                    selectedPageId={selectedPageId}
                  />
                </SidebarContent>
              </SidebarTabsContent>
            </SidebarTabs>

            <div className="mt-auto p-4 space-y-2 border-t">
              <Button variant="outline" className="w-full gap-1" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" /> К опросам
              </Button>
              <Button variant="outline" className="w-full gap-1" onClick={handlePreviewClick}>
                <Eye className="h-4 w-4" /> Предпросмотр
              </Button>
              {activeTab === 'questions' && (
                <Button className="w-full" onClick={handleAddQuestion}>
                  Добавить вопрос
                </Button>
              )}
              {activeTab === 'pages' && (
                <Button className="w-full" onClick={() => {
                  const newPage: Page = {
                    id: crypto.randomUUID(),
                    title: `Страница ${pages.length + 1}`,
                    questions: []
                  };
                  handleUpdatePages([...pages, newPage]);
                  setSelectedPageId(newPage.id);
                }}>
                  Добавить страницу
                </Button>
              )}
            </div>
          </Sidebar>

          <div className="flex-1 h-screen">
            <ReactFlowProvider>
              <VisualEditor
                questions={currentPageQuestions}
                onUpdateQuestions={handleUpdateQuestions}
                pages={pages}
              />
            </ReactFlowProvider>
          </div>
        </div>
      </SidebarProvider>

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
