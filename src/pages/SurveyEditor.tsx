import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyStore } from "../store/survey-store";
import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import VisualEditor from '@/components/survey-editor/VisualEditor';
import { SidebarTreeView } from '@/components/survey-editor/SidebarTreeView';
import ResolutionEditDialog from '@/components/survey-editor/ResolutionEditDialog';
// Новые импорты:
import { useSurveyEditorState } from './survey-editor/hooks/useSurveyEditorState';
import { useSurveyHandlers } from './survey-editor/hooks/useSurveyHandlers';
import { SurveyNotFound } from './survey-editor/SurveyNotFound';
import { SurveyEditorToolbar } from './survey-editor/SurveyEditorToolbar';
import { SurveyEditorPreview } from './survey-editor/SurveyEditorPreview';
import type { Page } from '@survey-platform/shared-types';
import { ArrowLeft, Eye, Plus, FilePlus } from 'lucide-react';
import { QUESTION_TYPES } from '@survey-platform/shared-types';

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

export default function SurveyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateSurvey } = useSurveyStore();

  // 1. Состояния редактора
  const state = useSurveyEditorState(id);

  // 2. Обработчики
  const handlers = useSurveyHandlers({
    survey: state.survey,
    currentVersion: state.currentVersion,
    questions: state.questions,
    pages: state.pages,
    updateSurvey,
    setSelectedQuestionId: state.setSelectedQuestionId,
  });

  // 3. Если опрос не найден
  if (!state.survey || !state.currentVersion) {
    return <SurveyNotFound navigate={navigate} />;
  }

  // 4. Основной рендер
  const questionsOfSelectedPage = state.questions.filter(q => q.pageId === state.selectedPageId);

  // Добавить вопрос на выбранную страницу
  function handleAddQuestion() {
    if (!state.selectedPageId) return;
    const pageQuestions = state.questions.filter(q => q.pageId === state.selectedPageId);
    const nextNumber = pageQuestions.length + 1;
    let newId = crypto.randomUUID();
    while (state.questions.some(q => q.id === newId)) {
      newId = crypto.randomUUID();
    }
    const newQuestion = {
      id: newId,
      pageId: state.selectedPageId,
      title: `Новый вопрос ${nextNumber}`,
      type: QUESTION_TYPES.Text,
      required: false,
      position: { x: 250, y: pageQuestions.length * 150 },
      options: undefined
    };
    handlers.handleUpdateQuestions([...state.questions, newQuestion]);
    state.setSelectedQuestionId(newId);
  }

  // Добавить новую страницу
  function handleAddPage() {
    let newId = crypto.randomUUID();
    while (state.pages.some(p => p.id === newId)) {
      newId = crypto.randomUUID();
    }
    const newPage = {
      id: newId,
      title: `Страница ${state.pages.length + 1}`,
      questions: []
    };
    handlers.handleUpdatePages([...state.pages, newPage]);
    state.setSelectedPageId(newId);
  }

  return (
    <div className="flex h-screen w-full">
      {/* Сайдбар */}
      <div className="w-[340px] h-screen flex flex-col bg-gray-50 border-r min-h-0">
        <div className="flex items-center gap-2 p-4 border-b">
          <button
            className="shrink-0 rounded border p-2 hover:bg-gray-100 flex items-center justify-center"
            tabIndex={0}
            aria-label="К опросам"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span
            className="ml-2 text-2xl font-bold truncate whitespace-nowrap overflow-hidden text-ellipsis block"
            style={{ maxWidth: 'calc(100% - 64px)' }}
            title={state.survey.title}
          >
            {state.survey.title}
          </span>
        </div>
        <div className="text-gray-500 px-4">{state.survey.description}</div>
        {/* Кнопки управления */}
        <div className="flex justify-between gap-2 my-6 px-4" style={{ marginBottom: '12px', marginTop: '12px' }}>
          <button
            className="w-10 h-10 flex items-center justify-center border rounded hover:bg-gray-100"
            onClick={() => state.setIsPreviewOpen(true)}
            data-testid="preview-btn"
            aria-label="Предпросмотр"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center border rounded hover:bg-gray-100"
            onClick={handleAddQuestion}
            disabled={!state.selectedPageId}
            data-testid="add-question-btn"
            aria-label="Добавить вопрос"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center border rounded hover:bg-gray-100"
            onClick={handleAddPage}
            data-testid="add-page-btn"
            aria-label="Добавить страницу"
          >
            <FilePlus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SidebarTreeView
              pages={state.pages}
              questions={state.questions}
              selectedPageId={state.selectedPageId}
              selectedQuestionId={state.selectedQuestionId}
              onSelectPage={state.setSelectedPageId}
              onSelectQuestion={state.setSelectedQuestionId}
              onQuestionOrderChange={handlers.handleUpdateQuestions}
            />
          </div>
        </div>
      </div>
      {/* Визуальный редактор */}
      <div className="flex-1 h-screen">
        <ReactFlowProvider>
          <VisualEditor
            questions={questionsOfSelectedPage}
            pages={state.pages}
            allQuestions={state.questions}
            selectedQuestionId={state.selectedQuestionId}
            setSelectedQuestionId={state.setSelectedQuestionId}
            onUpdateQuestions={handlers.handleUpdateQuestions}
          />
        </ReactFlowProvider>
      </div>
      {/* Модалка предпросмотра */}
      <SurveyEditorPreview
        open={state.isPreviewOpen}
        onClose={() => state.setIsPreviewOpen(false)}
        questions={state.questions}
        pages={state.pages}
      />
      {/* Диалоги, модалки и т.д. */}
      {state.editingResolution && (
        <ResolutionEditDialog
          resolutionQuestion={state.editingResolution}
          questions={state.questions}
          open={!!state.editingResolution}
          onSave={updated => {
            const updatedQuestions = state.questions.map(q => q.id === updated.id ? updated : q);
            handlers.handleUpdateQuestions(updatedQuestions);
          }}
          onClose={() => state.setEditingResolution(null)}
        />
      )}
    </div>
  );
}