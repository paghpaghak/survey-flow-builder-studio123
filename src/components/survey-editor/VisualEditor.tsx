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
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './flow.css';
import { Question } from '@/types/survey';
import QuestionNode from './QuestionNode';
import QuestionEditDialog from './QuestionEditDialog';
import { DndContext, useDraggable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useSurveyStore } from '@/store/survey-store';

interface VisualEditorProps {
  questions: Question[];
  onUpdateQuestions?: (questions: Question[]) => void;
  readOnly?: boolean;
  pages: { id: string; title: string }[];
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
export default function VisualEditor({ questions, onUpdateQuestions, readOnly = false, pages }: VisualEditorProps) {
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

  const handleDeleteQuestion = useCallback((id: string) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    onUpdateQuestions?.(updatedQuestions);
  }, [questions, onUpdateQuestions]);

  const handleEditQuestion = useCallback((updatedQuestion: Question) => {
    const updatedQuestions = questions.map(q =>
      q.id === updatedQuestion.id 
        ? { ...updatedQuestion, position: q.position || updatedQuestion.position } 
        : q
    );
    onUpdateQuestions?.(updatedQuestions);
  }, [questions, onUpdateQuestions]);

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
            ? { 
                ...q, 
                position: change.position,
                pageId: question.pageId
              }
            : q
        );

        onUpdateQuestions?.(updatedQuestions);
      }
    });
    onNodesChange(changes);
  }, [onNodesChange, questions, onUpdateQuestions]);

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    if (!onUpdateQuestions) return;

    const question = questions.find(q => q.id === node.id);
    if (!question) return;

    const updatedQuestions = questions.map(q =>
      q.id === node.id 
        ? { 
            ...q, 
            position: node.position,
            pageId: question.pageId
          }
        : q
    );

    nodesPositionsRef.current[node.id] = node.position;
    onUpdateQuestions(updatedQuestions);
  }, [questions, onUpdateQuestions]);

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
          onEditClick: openEditDialog,
          pages,
          pageName: page?.title || 'Без страницы'
        },
      });
    });

    setNodes(newNodes);
  }, [questions, handleDeleteQuestion, handleEditQuestion, openEditDialog, pages]);

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
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', style: { stroke: '#3b82f6' } }, eds)),
    [setEdges]
  );

  return (
    <DndContext sensors={sensors}>
      <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        onNodeDragStop={onNodeDragStop}
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
    </div>
    </DndContext>
  );
}
