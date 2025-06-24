import { useSurveyStore } from "../store/survey-store";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import React from 'react';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Question, Page, QuestionType } from '@survey-platform/shared-types';
import VisualEditor from '@/components/survey-editor/VisualEditor';
import { toast } from 'sonner';
import { SurveyPreview } from '@/components/survey-preview/SurveyPreview';
import { ReactFlowProvider } from '@xyflow/react';
import { SidebarTreeView } from '@/components/survey-editor/SidebarTreeView';
import ResolutionEditDialog from '@/components/survey-editor/ResolutionEditDialog';
import { useSurveyEditor, normalizePage } from '@/hooks/useSurveyEditor';
import { useSurveyOperations } from '@/hooks/useSurveyOperations';
import { useQuestionOperations } from '@/hooks/useQuestionOperations';

/**
 * <summary>
 * Страница редактора опроса. Позволяет создавать, редактировать и структурировать страницы и вопросы опроса.
 * Использует Zustand для хранения состояния, поддерживает drag-and-drop, предпросмотр и визуальное редактирование.
 * </summary>
 */

function SurveyNotFound({ navigate }: { navigate: () => void }) {
  console.log('SurveyNotFound rendered');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <Button variant="ghost" className="gap-1" onClick={() => navigate()}> 
          <ArrowLeft className="h-4 w-4" /> Назад к опросам
        </Button>
      </div>
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Опрос не найден</h2>
        <p className="text-gray-500 mb-4">Опрос, который вы ищете, не существует или был удалён.</p>
        <Button onClick={() => navigate()}>Вернуться к списку опросов</Button>
      </div>
    </div>
  );
}

export default function SurveyEditor() {
  const editor = useSurveyEditor();
  
  const { survey, currentVersion, questions, pages } = editor;
  
  // ВСЕГДА инициализируем хуки (даже если данных нет)
  // Инициализируем операции с опросами и страницами
  const surveyOps = useSurveyOperations({
    survey: survey || {} as any,
    currentVersion: currentVersion || {} as any,
    pages: pages || [],
    selectedPageId: editor.selectedPageId,
    setSelectedPageId: editor.setSelectedPageId,
    setSelectedQuestionId: editor.setSelectedQuestionId,
    selectedQuestionId: editor.selectedQuestionId
  });
  
  // Инициализируем операции с вопросами
  const questionOps = useQuestionOperations({
    questions: questions || [],
    pages: pages || [],
    currentVersion: currentVersion || {} as any,
    selectedPageId: editor.selectedPageId,
    setSelectedQuestionId: editor.setSelectedQuestionId,
    setPendingPreview: editor.setPendingPreview,
    updateSurveyVersion: surveyOps.updateSurveyVersion
  });

  // УСЛОВНАЯ ЛОГИКА ТОЛЬКО ПОСЛЕ ВСЕХ ХУКОВ
  if (!editor.isReady) {
    console.log('SurveyEditor: survey or currentVersion not found, rendering SurveyNotFound');
    return <SurveyNotFound navigate={() => editor.navigate('/')} />;
  }













  return (
    <div className="flex h-screen w-full">
      <div className="w-[340px] h-screen flex flex-col bg-gray-50 border-r min-h-0">
        <div className="flex items-center gap-2 p-4 border-b">
          <Button
            variant="outline"
            size="icon"
            onClick={() => editor.navigate('/')}
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
          <Button className="w-[90px] h-10 text-lg" variant="outline" size="icon" onClick={questionOps.handlePreviewClick} data-testid="preview-btn">
            <Eye className="h-5 w-5" />
          </Button>
          <Button className="w-[90px] h-10 text-lg" size="icon" onClick={questionOps.handleAddQuestion} disabled={!editor.selectedPageId} data-testid="add-question-btn">
            <span title="Добавить вопрос">+</span>
          </Button>
          <Button className="w-[90px] h-10 text-lg" size="icon" onClick={() => {
            const newPage = {
              id: crypto.randomUUID(),
              title: `Страница ${pages.length + 1}`,
              questions: []
            };
            surveyOps.handleUpdatePages([...pages, newPage]);
            editor.setSelectedPageId(newPage.id);
          }} data-testid="add-page-btn">
            <span title="Добавить страницу">📄</span>
          </Button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SidebarTreeView
              pages={pages}
              questions={questions}
              selectedPageId={editor.selectedPageId}
              selectedQuestionId={editor.selectedQuestionId}
              onSelectPage={(id) => {
                editor.setSelectedPageId(id);
                editor.setSelectedQuestionId(undefined);
              }}
              onSelectQuestion={questionId => {
                const q = questions.find(q => q.id === questionId);
                if (!q) return;
                // Если вопрос не на текущей странице — переключаем страницу
                if (q.pageId !== editor.selectedPageId) {
                  editor.setSelectedPageId(q.pageId);
                }
                // Если вопрос вложенный в параллельную ветку — выделяем ветку
                const parentParallel = questions.find(
                  pq => pq.type === QUESTION_TYPES.ParallelGroup && Array.isArray(pq.parallelQuestions) && pq.parallelQuestions.includes(questionId)
                );
                if (parentParallel) {
                  editor.setSelectedQuestionId(parentParallel.id);
                } else {
                  editor.setSelectedQuestionId(questionId);
                }
              }}
              onQuestionOrderChange={questionOps.handleQuestionOrderChange}
              onUpdatePageTitle={surveyOps.handleUpdatePageTitle}
              onUpdateQuestionTitle={questionOps.handleUpdateQuestionTitle}
              onDeleteQuestion={questionOps.handleDeleteQuestion}
              onDeletePage={(pageId) => surveyOps.handleDeletePage(pageId, questions)}
              onUpdatePageDescription={surveyOps.handleUpdatePageDescription}
              onAddResolution={questionOps.handleAddResolution}
              onEditResolution={q => editor.setEditingResolution(q)}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 h-screen">
        <ReactFlowProvider>
          <VisualEditor
            questions={questions.filter(q => q.pageId === editor.selectedPageId)}
            onUpdateQuestions={questionOps.handleUpdateQuestions}
            pages={pages}
            selectedQuestionId={editor.selectedQuestionId}
            setSelectedQuestionId={editor.setSelectedQuestionId}
            allQuestions={questions}
          />
        </ReactFlowProvider>
      </div>

      {editor.isPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="survey-preview-modal">
          <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-auto">
            <div className="p-4 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-semibold">Предпросмотр опроса</h2>
              <Button variant="ghost" onClick={() => editor.setIsPreviewOpen(false)}>✕</Button>
            </div>
            <SurveyPreview
              questions={questions}
              pages={pages}
              onClose={() => editor.setIsPreviewOpen(false)}
            />
          </div>
        </div>
      )}

      {editor.editingResolution && (
        <ResolutionEditDialog
          resolutionQuestion={editor.editingResolution}
          questions={questions}
          open={!!editor.editingResolution}
          onSave={updated => {
            const updatedQuestions = questions.map(q => q.id === updated.id ? updated : q);
            questionOps.handleUpdateQuestions(updatedQuestions);
          }}
          onClose={() => editor.setEditingResolution(null)}
        />
      )}
    </div>
  );
}