import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyStore } from '@/store/survey-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import React, { useState } from 'react';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Question, QuestionType } from '@survey-platform/shared-types';
import VisualEditor from '@/components/survey-editor/VisualEditor';
import { SurveyPreview } from '@/components/survey-preview/SurveyPreview';
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
import { ReactFlowProvider } from '@xyflow/react';

export default function SurveyView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { surveys } = useSurveyStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'pages'>('questions');
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>();

  const survey = surveys.find(s => s.id === id);
  const currentVersion = survey?.versions.find(v => v.version === survey.currentVersion);
  const questions = currentVersion?.questions || [];
  const pages = currentVersion?.pages || [];

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

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QUESTION_TYPES.Text:
        return "Текст";
      case QUESTION_TYPES.Radio:
        return "Один из списка";
      case QUESTION_TYPES.Checkbox:
        return "Несколько из списка";
      case QUESTION_TYPES.Select:
        return "Выпадающий список";
      case QUESTION_TYPES.Date:
        return "Дата";
      case QUESTION_TYPES.Email:
        return "Email";
      case QUESTION_TYPES.Phone:
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
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Button variant="outline" className="gap-1" onClick={() => navigate('/')}>
                    <ArrowLeft className="h-4 w-4" /> К опросам
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-1" 
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={questions.length === 0}
                  >
                    <Eye className="h-4 w-4" /> Предпросмотр
                  </Button>
                </div>
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
                        <div className="text-gray-400 px-2 py-6">
                          {selectedPageId 
                            ? 'На этой странице пока нет вопросов.'
                            : 'Выберите страницу для отображения вопросов.'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {currentPageQuestions.map((q, idx) => (
                            <div key={q.id} className="flex items-center justify-between w-full bg-white p-2 rounded">
                              <div>
                                <div className="font-medium">{q.title}</div>
                                <div className="text-sm text-gray-500">
                                  {getQuestionTypeLabel(q.type)}
                                  {q.required && <span className="ml-1 text-rose-500">*</span>}
                                </div>
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
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        className={`p-3 cursor-pointer rounded-lg ${
                          page.id === selectedPageId ? 'bg-primary/10' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedPageId(page.id)}
                      >
                        <div className="font-medium">{page.title}</div>
                        <div className="text-sm text-gray-500">
                          {questions.filter(q => q.pageId === page.id).length} вопросов
                        </div>
                      </div>
                    ))}
                  </div>
                </SidebarContent>
              </SidebarTabsContent>
            </SidebarTabs>
          </Sidebar>
          
          <div className="flex-1 h-screen">
            <ReactFlowProvider>
              <VisualEditor
                questions={currentPageQuestions}
                allQuestions={questions}
                readOnly={true}
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