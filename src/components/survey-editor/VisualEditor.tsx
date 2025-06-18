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
import QuestionEditDialog from '../QuestionEditDialog';
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
 * Исключает отображение вложенных вопросов параллельных групп.
 * </summary>
 * <param name="questions">Вопросы для отображения</param>
 * <param name="onUpdateQuestions">Колбэк для обновления вопросов</param>
 * <param name="pages">Список страниц</param>
 * <param name="allQuestions">Все вопросы опроса для контекста</param>
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
    console.log('[VisualEditor] Удаление вопроса:', id);
    console.log('[VisualEditor] allQuestions до удаления:', allQuestions.length);
    
    const questionToDelete = allQuestions.find(q => q.id === id);
    let questionsToDelete = [id];
  
    // Если удаляется параллельная группа, добавляем все вложенные вопросы
    if (questionToDelete?.type === QuestionType.ParallelGroup && questionToDelete.parallelQuestions) {
      questionsToDelete = [...questionsToDelete, ...questionToDelete.parallelQuestions];
    }
  
    console.log('[VisualEditor] Вопросы к удалению:', questionsToDelete);
  
    // Удаляем все связанные вопросы из allQuestions
    const updatedAllQuestions = allQuestions.filter(q => !questionsToDelete.includes(q.id));
    
    // Также удаляем все transitionRules, которые ссылаются на удаляемые вопросы
    const cleanedQuestions = updatedAllQuestions.map(q => ({
      ...q,
      transitionRules: q.transitionRules?.filter(rule => !questionsToDelete.includes(rule.nextQuestionId))
    }));
    
    console.log('[VisualEditor] cleanedQuestions после удаления:', cleanedQuestions.length);
    console.log('[VisualEditor] Вызываем onUpdateQuestions');
    
    onUpdateQuestions?.(cleanedQuestions);
  }, [allQuestions, onUpdateQuestions]);


  const handleEditQuestion = useCallback((updatedQuestion: Question) => {
    const exists = allQuestions.some(q => q.id === updatedQuestion.id);
    let updatedQuestions: Question[];
    if (exists) {
      updatedQuestions = allQuestions.map(q =>
        q.id === updatedQuestion.id
          ? { ...updatedQuestion, position: q.position || updatedQuestion.position }
          : q
      );
    } else {
      updatedQuestions = [...allQuestions, updatedQuestion];
    }
    onUpdateQuestions?.(updatedQuestions);
  }, [allQuestions, onUpdateQuestions]);

  const openEditDialog = useCallback((question: Question) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  }, []);

  const handleNodesChange = useCallback((changes: any[]) => {
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.position) {
        nodesPositionsRef.current[change.id] = change.position;
        const question = allQuestions.find(q => q.id === change.id);
        if (!question) return;
        const updatedQuestions = allQuestions.map(q =>
          q.id === change.id
            ? { ...q, position: change.position, pageId: question.pageId }
            : q
        );
        callUpdateQuestionsWithDefaults(updatedQuestions);
      }
    });
    onNodesChange(changes);
  }, [onNodesChange, allQuestions, callUpdateQuestionsWithDefaults]);

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    if (!onUpdateQuestions) return;
    const question = allQuestions.find(q => q.id === node.id);
    if (!question) return;
    const updatedQuestions = allQuestions.map(q =>
      q.id === node.id
        ? { ...q, position: node.position, pageId: question.pageId }
        : q
    );
    nodesPositionsRef.current[node.id] = node.position;
    callUpdateQuestionsWithDefaults(updatedQuestions);
  }, [allQuestions, callUpdateQuestionsWithDefaults, onUpdateQuestions]);

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
      if (q.type === QuestionType.ParallelGroup && q.parallelQuestions) {
        q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
      }
    });

    return questions.filter(q => !allParallelQuestionIds.has(q.id));
  }, [questions, allQuestions]);

  useEffect(() => {
    const visibleQuestions = getVisibleQuestions();
    const newNodes: Node[] = [];
    
    visibleQuestions.forEach((question, index) => {
      // Для параллельных групп и обычных вопросов
      if (question.type !== QuestionType.Resolution) {
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
            onEditClick: question.type === QuestionType.ParallelGroup 
              ? (q: Question) => setEditingParallelGroup(q)
              : openEditDialog,
            pages,
            pageName: page?.title || 'Без страницы',
          },
          selected: selectedQuestionId === question.id,
        });
      }
    });
    
    setNodes(newNodes);
  }, [questions, allQuestions, handleDeleteQuestion, handleEditQuestion, openEditDialog, pages, setEditingParallelGroup, selectedQuestionId, getVisibleQuestions]);

  useEffect(() => {
    const visibleQuestions = getVisibleQuestions();
    const newEdges = [];
    
    visibleQuestions.forEach(question => {
      if (question.transitionRules) {
        question.transitionRules.forEach(rule => {
          const targetQuestion = visibleQuestions.find(q => q.id === rule.nextQuestionId);
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
  }, [questions, allQuestions, getVisibleQuestions]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const sourceQuestion = allQuestions.find(q => q.id === params.source);
      const targetQuestion = allQuestions.find(q => q.id === params.target);
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
      
      const updatedQuestions = allQuestions.map(q =>
        q.id === sourceQuestion.id
          ? { ...q, transitionRules: [...(q.transitionRules || []), newRule] }
          : q
      );
      callUpdateQuestionsWithDefaults(updatedQuestions);
    },
    [allQuestions, callUpdateQuestionsWithDefaults]
  );

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
            availableQuestions={allQuestions}
            onClose={() => setIsDialogOpen(false)}
            onSave={handleEditQuestion}
            readOnly={readOnly}
          />
        )}

        {editingParallelGroup && (
          <QuestionEditDialog
            question={editingParallelGroup}
            availableQuestions={allQuestions}
            onClose={() => setEditingParallelGroup(null)}
            onSave={handleEditQuestion}
          />
        )}
      </div>
    </DndContext>
  );
}