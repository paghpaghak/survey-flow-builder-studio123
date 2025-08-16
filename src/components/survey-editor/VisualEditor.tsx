import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeTypes,
  Node,
  SmoothStepEdge,
  MarkerType,
  useReactFlow,
  Edge,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './flow.css';
import { Button } from '@/components/ui/button';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Question, QuestionType, Page } from '@survey-platform/shared-types';
import QuestionNode from './QuestionNode';
import ParallelGroupContainerNode from './ParallelGroupContainerNode';
import ResolutionNode from './ResolutionNode';
import QuestionEditDialog from '../QuestionEditDialog';
import { useSurveyStore } from '@/store/survey-store';
import ResolutionEditDialog from './ResolutionEditDialog';
import { withDefaultTransitions, generateRuleId } from './utils/flow-helpers';
import { useFlowNodesAndEdges } from './hooks/useFlowNodesAndEdges';
import { useQuestionCrud } from './hooks/useQuestionCrud';
import { useNodeEvents } from './hooks/useNodeEvents';

interface VisualEditorProps {
  questions: Question[];
  onUpdateQuestions?: (questions: Question[]) => void;
  readOnly?: boolean;
  pages: Page[];
  selectedQuestionId?: string;
  setSelectedQuestionId?: (id: string) => void;
  allQuestions: Question[];
}

const nodeTypes: NodeTypes = {
  questionNode: QuestionNode,
  parallelGroupNode: ParallelGroupContainerNode,
};

const edgeTypes: EdgeTypes = {
  smoothstep: SmoothStepEdge
};

/**
 * <summary>
 * Компонент визуального редактора вопросов для страницы опроса.
 * Позволяет перетаскивать, редактировать и группировать вопросы.
 * Исключает отображение вложенных вопросов параллельных групп.
 * </summary>
 * <param name="questions">Вопросы для отображения</param>
 * <param name="onUpdateQuestions">Колбэк для обновления вопросов</param>
 * <param name="pages">Список страниц</param>
 * <param name="allQuestions">Все вопросы опроса для контекста</param>
 */

export default function VisualEditor({ questions, onUpdateQuestions, readOnly = false, pages, selectedQuestionId, setSelectedQuestionId, allQuestions }: VisualEditorProps) {
  const {
    selectedQuestion,
    isDialogOpen,
    handleDeleteQuestion,
    handleEditQuestion,
    openEditDialog,
    closeEditDialog,
  } = useQuestionCrud({ allQuestions, onUpdateQuestions });
  
  const { nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange } = useFlowNodesAndEdges({
    questions,
    allQuestions,
    selectedQuestionId,
    readOnly,
    pages,
    onDelete: handleDeleteQuestion,
    onEditClick: openEditDialog,
  });
  
  const { onNodeDragStop, onConnect } = useNodeEvents({
    allQuestions,
    onUpdateQuestions,
  });
  
  const store = useSurveyStore();
  const reactFlow = useReactFlow();
  const [editingParallelGroup, setEditingParallelGroup] = useState<Question | null>(null);
  const [editingResolution, setEditingResolution] = useState<Question | null>(null);

  const callUpdateQuestionsWithDefaults = useCallback((updatedQuestions: Question[]) => {
    const withDefaults = withDefaultTransitions(updatedQuestions);
    onUpdateQuestions?.(withDefaults);
  }, [onUpdateQuestions]);

  const getQuestionsGroupedByPage = useCallback(() => {
    const groupedQuestions: Record<string, Question[]> = {};
    questions.forEach(question => {
      const pageId = question.pageId || 'unassigned';
      if (!groupedQuestions[pageId]) {
        groupedQuestions[pageId] = [];
      }
      groupedQuestions[pageId].push(question);
    });
    return groupedQuestions;
  }, [questions]);

  // Фильтруем вопросы для отображения в визуальном редакторе
  const getVisibleQuestions = useCallback(() => {
    // Исключаем вложенные вопросы параллельных групп
    const allParallelQuestionIds = new Set<string>();
    allQuestions.forEach(q => {
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions) {
        q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
      }
    });

    return questions.filter(q => !allParallelQuestionIds.has(q.id));
  }, [questions, allQuestions]);

  const onEdgesChangeSync = useCallback(
    (changes: any[]) => {
      let updated = false;
      let updatedQuestions = allQuestions;
      changes.forEach(change => {
        if (change.type === 'remove') {
          const [source, target, ruleId] = (change.id || '').split('-');
          updatedQuestions = updatedQuestions.map(q =>
            q.id === source
              ? { ...q, transitionRules: (q.transitionRules || []).filter(r => r.id !== ruleId) }
              : q
          );
          updated = true;
        }
      });
      if (updated) callUpdateQuestionsWithDefaults(updatedQuestions);
      onEdgesChange(changes);
    },
    [allQuestions, callUpdateQuestionsWithDefaults, onEdgesChange]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChangeSync}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        onNodeClick={(_, node) => {
          if (setSelectedQuestionId) setSelectedQuestionId(node.id);
        }}
        onNodesDelete={(nodesToDelete) => {
          if (readOnly) return;
          nodesToDelete.forEach(node => handleDeleteQuestion(node.id));
        }}
        connectionMode={ConnectionMode.Loose}
        selectionKeyCode={null}
        className="bg-gray-50"
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Controls />
        <Background />
        <MiniMap 
          zoomable 
          pannable 
          position="bottom-right"
          nodeColor={(node) => {
            if (node.id === selectedQuestionId) return '#3b82f6'; // синий для выбранного
            return '#94a3b8'; // серый для остальных
          }}
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            width: 200,
            height: 150,
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
        />
      </ReactFlow>

      {selectedQuestion && (
        <QuestionEditDialog
          key={selectedQuestion.id}
          onClose={() => closeEditDialog()}
          question={selectedQuestion}
          onSave={handleEditQuestion}
          readOnly={readOnly}
          availableQuestions={allQuestions}
        />
      )}

      {editingParallelGroup && (
        <QuestionEditDialog
          key={editingParallelGroup.id}
          onClose={() => setEditingParallelGroup(null)}
          question={editingParallelGroup}
          onSave={handleEditQuestion}
          availableQuestions={allQuestions}
        />
      )}

      {editingResolution && (
        <ResolutionEditDialog
          resolutionQuestion={editingResolution}
          questions={allQuestions}
          open={!!editingResolution}
          onClose={() => setEditingResolution(null)}
          onSave={handleEditQuestion}
        />
      )}
    </div>
  );
}