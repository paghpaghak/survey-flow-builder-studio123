import { useEffect } from 'react';
import { useNodesState, useEdgesState, Node, Edge, MarkerType } from '@xyflow/react';
import { Question, QUESTION_TYPES, Page } from '@survey-platform/shared-types';

interface UseFlowNodesAndEdgesProps {
  questions: Question[];
  allQuestions: Question[];
  selectedQuestionId?: string;
  readOnly?: boolean;
  pages: Page[];
  onDelete: (id: string) => void;
  onEditClick: (question: Question) => void;
}

export function useFlowNodesAndEdges({
  questions,
  allQuestions,
  selectedQuestionId,
  readOnly,
  pages,
  onDelete,
  onEditClick,
}: UseFlowNodesAndEdgesProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Фильтруем вопросы для отображения в визуальном редакторе
  const getVisibleQuestions = () => {
    // Исключаем вложенные вопросы параллельных групп
    const allParallelQuestionIds = new Set<string>();
    allQuestions.forEach(q => {
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions) {
        q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
      }
    });
    return questions.filter(q => !allParallelQuestionIds.has(q.id));
  };

  useEffect(() => {
    const visibleQuestions = getVisibleQuestions();
    const newNodes: Node[] = [];
    
    visibleQuestions.forEach((question, index) => {
      const isSelected = question.id === selectedQuestionId;
      const nodeType = question.type === 'resolution' ? 'resolutionNode' : 'questionNode';
      const page = pages.find(p => p.id === question.pageId);

      let nodeData = {};
      if (nodeType === 'questionNode') {
        nodeData = {
          question: question,
          readOnly,
          isSelected,
          onDelete,
          onEditClick,
          pageName: page?.title || 'Без страницы',
        };
      }

      newNodes.push({
        id: question.id,
        type: nodeType,
        position: question.position || { x: (index % 5) * 250, y: Math.floor(index / 5) * 200 },
        data: nodeData,
        style: {
          border: isSelected ? '2px solid #3b82f6' : undefined,
          boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : undefined,
        },
      });
    });

    const newEdges: Edge[] = [];
    visibleQuestions.forEach(question => {
      if (question.transitionRules) {
        question.transitionRules.forEach(rule => {
          const targetQuestion = allQuestions.find(q => q.id === rule.nextQuestionId);
          if (targetQuestion) {
            newEdges.push({
              id: `e-${question.id}-${rule.nextQuestionId}-${rule.id}`,
              source: question.id,
              target: rule.nextQuestionId,
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
              },
              label: rule.condition ? `${rule.condition} ${rule.value}` : rule.answer,
              animated: selectedQuestionId === question.id,
            });
          }
        });
      }
    });

    // Добавляем рёбра по умолчанию для вопросов без transitionRules
    visibleQuestions.forEach((question, index) => {
      const nextQuestion = visibleQuestions[index + 1];
      if (nextQuestion && (!question.transitionRules || question.transitionRules.length === 0)) {
        newEdges.push({
          id: `e-${question.id}-${nextQuestion.id}-default`,
          source: question.id,
          target: nextQuestion.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [questions, allQuestions, selectedQuestionId, readOnly, pages, onDelete, onEditClick, setNodes, setEdges]);

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
  };
} 