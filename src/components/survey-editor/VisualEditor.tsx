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
  Panel,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './flow.css';
import { Question, QuestionType } from '@/types/survey';
import QuestionNode from './QuestionNode';
import ResolutionNode from './ResolutionNode';
import QuestionEditDialog from './QuestionEditDialog';
import { DndContext, useDraggable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useSurveyStore } from '@/store/survey-store';
import ResolutionEditDialog from './ResolutionEditDialog';

interface VisualEditorProps {
  questions: Question[];
  onUpdateQuestions?: (questions: Question[]) => void;
  readOnly?: boolean;
  pages: { id: string; title: string }[];
  selectedQuestionId?: string;
  setSelectedQuestionId?: (id: string) => void;
  allQuestions: Question[];
}

const nodeTypes: NodeTypes = {
  questionNode: QuestionNode,
};

const edgeTypes: EdgeTypes = {
  smoothstep: SmoothStepEdge
};

function DraggableQuestion({ question, children, readOnly, onPositionChange }: { 
  question: Question; 
  children: React.ReactNode;
  readOnly?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: question.id,
    data: question,
    disabled: readOnly
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

/**
 * <summary>
 * Компонент визуального редактора вопросов для страницы опроса.
 * Позволяет перетаскивать, редактировать и группировать вопросы.
 * </summary>
 * <param name="questions">Вопросы для отображения</param>
 * <param name="onUpdateQuestions">Колбэк для обновления вопросов</param>
 * <param name="pages">Список страниц</param>
 */

// Хелпер для генерации id правила
function generateRuleId() {
  return Math.random().toString(36).slice(2, 10);
}

// Хелпер для генерации дефолтных transitionRules для линейного перехода
function withDefaultTransitions(questions: Question[]): Question[] {
  const grouped: Record<string, Question[]> = {};
  questions.forEach(q => {
    const key = q.pageId || 'default';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  });
  let result: Question[] = [];
  Object.values(grouped).forEach(group => {
    group.forEach((q, idx) => {
      if (q.transitionRules && q.transitionRules.length > 0) {
        result.push(q);
        return;
      }
      const next = group[idx + 1];
      if (next) {
        result.push({
          ...q,
          transitionRules: [{
            id: generateRuleId(),
            nextQuestionId: next.id,
            answer: '',
          }],
        });
      } else {
        result.push(q);
      }
    });
  });
  return result;
}

export default function VisualEditor({ questions, onUpdateQuestions, readOnly = false, pages, selectedQuestionId, setSelectedQuestionId, allQuestions }: VisualEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const store = useSurveyStore();
  const nodesPositionsRef = useRef<Record<string, { x: number, y: number }>>({});
  const [editingParallelGroup, setEditingParallelGroup] = useState<Question | null>(null);
  const reactFlow = useReactFlow();
  const [editingResolution, setEditingResolution] = useState<Question | null>(null);

  // --- обёртка для onUpdateQuestions с автогенерацией дефолтных переходов ---
  const callUpdateQuestionsWithDefaults = useCallback((updatedQuestions: Question[]) => {
    const withDefaults = withDefaultTransitions(updatedQuestions);
    onUpdateQuestions?.(withDefaults);
  }, [onUpdateQuestions]);

  const handleDeleteQuestion = useCallback((id: string) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    callUpdateQuestionsWithDefaults(updatedQuestions);
  }, [questions, callUpdateQuestionsWithDefaults]);

  const handleEditQuestion = useCallback((updatedQuestion: Question) => {
    const exists = questions.some(q => q.id === updatedQuestion.id);
    let updatedQuestions: Question[];
    if (exists) {
      updatedQuestions = questions.map(q =>
        q.id === updatedQuestion.id
          ? { ...updatedQuestion, position: q.position || updatedQuestion.position }
          : q
      );
    } else {
      updatedQuestions = [...questions, updatedQuestion];
    }
    callUpdateQuestionsWithDefaults(updatedQuestions);
  }, [questions, callUpdateQuestionsWithDefaults]);

  const openEditDialog = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  }, []);

  const handleNodesChange = useCallback((changes: any[]) => {
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.position) {
        nodesPositionsRef.current[change.id] = change.position;
        const question = questions.find(q => q.id === change.id);
        if (!question) return;
        const updatedQuestions = questions.map(q =>
          q.id === change.id
            ? { ...q, position: change.position, pageId: question.pageId }
            : q
        );
        callUpdateQuestionsWithDefaults(updatedQuestions);
      }
    });
    onNodesChange(changes);
  }, [onNodesChange, questions, callUpdateQuestionsWithDefaults]);

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    if (!onUpdateQuestions) return;
    const question = questions.find(q => q.id === node.id);
    if (!question) return;
    const updatedQuestions = questions.map(q =>
      q.id === node.id
        ? { ...q, position: node.position, pageId: question.pageId }
        : q
    );
    nodesPositionsRef.current[node.id] = node.position;
    callUpdateQuestionsWithDefaults(updatedQuestions);
  }, [questions, callUpdateQuestionsWithDefaults, onUpdateQuestions]);

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

  useEffect(() => {
    const newNodes: Node[] = [];
    questions.forEach((question, index) => {
      // Если это параллельная ветка — отдельный тип ноды
      if (question.type === QuestionType.ParallelGroup) {
        const savedPosition = nodesPositionsRef.current[question.id];
        const existingPosition = question.position;
        const defaultPosition = {
          x: (index % 3) * 300 + 50,
          y: Math.floor(index / 3) * 200 + 50
        };
        const finalPosition = savedPosition || existingPosition || defaultPosition;
        const page = pages.find(p => p.id === question.pageId);
        newNodes.push({
          id: question.id,
          type: 'questionNode',
          position: finalPosition,
          data: {
            question: {
              ...question,
              position: finalPosition,
              pageId: question.pageId
            },
            onDelete: handleDeleteQuestion,
            onEdit: handleEditQuestion,
            onEditClick: (q: Question) => setEditingParallelGroup(q),
            pages,
            pageName: page?.title || 'Без страницы',
          },
          selected: selectedQuestionId === question.id,
        });
        // Не добавляем вложенные вопросы на основную схему
        return;
      }
      // Обычные вопросы (все, кроме параллельных и резолюции)
      if ((question.type as QuestionType) !== QuestionType.ParallelGroup && (question.type as QuestionType) !== QuestionType.Resolution) {
        // Проверяем, не вложенный ли это вопрос
        const isInParallel = questions.some(q => q.type === QuestionType.ParallelGroup && q.parallelQuestions?.includes(question.id));
        if (isInParallel) return;
        const savedPosition = nodesPositionsRef.current[question.id];
        const existingPosition = question.position;
        const defaultPosition = {
          x: (index % 3) * 300 + 50,
          y: Math.floor(index / 3) * 200 + 50
        };
        const finalPosition = savedPosition || existingPosition || defaultPosition;
        const page = pages.find(p => p.id === question.pageId);
        newNodes.push({
          id: question.id,
          type: 'questionNode',
          position: finalPosition,
          data: {
            question: {
              ...question,
              position: finalPosition,
              pageId: question.pageId
            },
            onDelete: handleDeleteQuestion,
            onEdit: handleEditQuestion,
            onEditClick: (q: Question) => setEditingParallelGroup(q),
            pages,
            pageName: page?.title || 'Без страницы',
          },
          selected: selectedQuestionId === question.id,
        });
      }
    });
    setNodes(newNodes);
  }, [questions, handleDeleteQuestion, handleEditQuestion, openEditDialog, pages, setEditingParallelGroup, selectedQuestionId]);

  useEffect(() => {
    const newEdges = [];
    
    questions.forEach(question => {
      if (question.transitionRules) {
        question.transitionRules.forEach(rule => {
          const targetQuestion = questions.find(q => q.id === rule.nextQuestionId);
          if (targetQuestion) {
            newEdges.push({
              id: `${question.id}-${rule.nextQuestionId}-${rule.id}`,
              source: question.id,
              target: rule.nextQuestionId,
              type: 'smoothstep',
              label: rule.answer || '',
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: '#3b82f6' }
            });
  }
        });
      }
    });

    setEdges(newEdges);
  }, [questions]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const sourceQuestion = questions.find(q => q.id === params.source);
      const targetQuestion = questions.find(q => q.id === params.target);
      if (!sourceQuestion || !targetQuestion) return;

      // --- Запрет входящих стрелок в параллельную ветку ---
      if (targetQuestion.type === QuestionType.ParallelGroup) {
        window.alert('Входящие переходы в параллельную ветку запрещены.');
        return;
      }

      // --- Разрешить только один выход наружу из параллельной ветки ---
      if (sourceQuestion.type === QuestionType.ParallelGroup) {
        // Считаем только переходы наружу (не на вложенные вопросы)
        const parallelIds = sourceQuestion.parallelQuestions || [];
        const outgoingRules = (sourceQuestion.transitionRules || []).filter(r => !parallelIds.includes(r.nextQuestionId));
        if (outgoingRules.length >= 1) {
          window.alert('Разрешён только один выход наружу из параллельной ветки.');
          return;
        }
        // Также не разрешаем делать переходы на вложенные вопросы (внутри ветки)
        if (parallelIds.includes(params.target)) {
          window.alert('Переходы на вложенные вопросы ветки не поддерживаются.');
          return;
        }
      }

      const exists = sourceQuestion.transitionRules?.some(r => r.nextQuestionId === params.target);
      if (exists) return;
      const newRule = {
        id: generateRuleId(),
        nextQuestionId: params.target,
        answer: '',
      };
      const updatedQuestions = questions.map(q =>
        q.id === sourceQuestion.id
          ? { ...q, transitionRules: [...(q.transitionRules || []), newRule] }
          : q
      );
      callUpdateQuestionsWithDefaults(updatedQuestions);
    },
    [questions, callUpdateQuestionsWithDefaults]
  );

  const onEdgesChangeSync = useCallback(
    (changes: any[]) => {
      let updated = false;
      let updatedQuestions = questions;
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
    [questions, callUpdateQuestionsWithDefaults, onEdgesChange]
  );

  // Центрируем и выделяем node при изменении selectedQuestionId
  useEffect(() => {
    if (selectedQuestionId && reactFlow && nodes.length > 0) {
      const node = nodes.find(n => n.id === selectedQuestionId);
      if (node) {
        reactFlow.setCenter(node.position.x + 125, node.position.y + 50, { zoom: 1.1, duration: 500 });
      }
    }
  }, [selectedQuestionId, nodes, reactFlow]);

  return (
    <DndContext sensors={sensors}>
      <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChangeSync}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => {
          if (setSelectedQuestionId) setSelectedQuestionId(node.id);
        }}
        selectionKeyCode={null}
      >
        <Controls />
          <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>

        {isDialogOpen && selectedQuestion && (
      <QuestionEditDialog
            question={selectedQuestion}
            availableQuestions={questions}
            onClose={() => setIsDialogOpen(false)}
        onSave={handleEditQuestion}
            readOnly={readOnly}
      />
        )}

        {editingParallelGroup && (
          <QuestionEditDialog
            question={editingParallelGroup}
            availableQuestions={questions}
            onClose={() => setEditingParallelGroup(null)}
            onSave={handleEditQuestion}
          />
        )}
    </div>
    </DndContext>
  );
}
