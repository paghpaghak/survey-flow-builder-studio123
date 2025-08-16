import { useEffect, useMemo } from 'react';
import { useNodesState, useEdgesState, Node, Edge, MarkerType } from '@xyflow/react';
import { Question, QUESTION_TYPES, Page } from '@survey-platform/shared-types';
import { buildParallelIndexes, calcChildGridPosition, calcContainerSize, findParentGroup } from '@/utils/parallelGroupUtils';

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

  // Индексы параллельных групп (мемоизируем для производительности)
  const { groupIdToChildren, childIdToParentId } = useMemo(() => buildParallelIndexes(allQuestions), [allQuestions]);

  useEffect(() => {
    const newNodes: Node[] = [];

    // 1) Добавляем контейнеры для всех ParallelGroup
    const parallelGroups = questions.filter((q) => q.type === QUESTION_TYPES.ParallelGroup);
    parallelGroups.forEach((group, index) => {
      const isSelected = group.id === selectedQuestionId;
      const page = pages.find((p) => p.id === group.pageId);
      const children = groupIdToChildren.get(group.id) || [];
      const { width, height } = calcContainerSize(children.length);

      newNodes.push({
        id: group.id,
        type: 'parallelGroupNode',
        position: group.position || { x: (index % 4) * 320, y: Math.floor(index / 4) * 260 },
        data: {
          group,
          children,
          expanded: true,
          onToggleExpand: () => {},
          pageName: page?.title || 'Без страницы',
        },
        style: {
          width,
          height,
          border: isSelected ? '2px solid #3b82f6' : undefined,
          boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : undefined,
        },
      });
    });

    // 2) Добавляем обычные вопросы и вложенные внутри контейнеров
    questions.forEach((question, index) => {
      if (question.type === QUESTION_TYPES.ParallelGroup) return; // уже добавлен как контейнер

      const isSelected = question.id === selectedQuestionId;
      const page = pages.find((p) => p.id === question.pageId);
      const parentGroupId = childIdToParentId.get(question.id);

      const baseNode: Node = {
        id: question.id,
        type: 'questionNode',
        position: question.position || { x: (index % 5) * 250, y: Math.floor(index / 5) * 200 },
        data: {
          question: question,
          readOnly,
          isSelected,
          onDelete,
          onEditClick,
          pageName: page?.title || 'Без страницы',
        },
        style: {
          border: isSelected ? '2px solid #3b82f6' : undefined,
          boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : undefined,
        },
      };

      if (parentGroupId) {
        const parentChildren = groupIdToChildren.get(parentGroupId) || [];
        const childIndex = parentChildren.findIndex((q) => q.id === question.id);
        const { x, y } = calcChildGridPosition(childIndex);
        baseNode.parentNode = parentGroupId;
        baseNode.extent = 'parent';
        baseNode.position = { x, y };
      }

      newNodes.push(baseNode);
    });

    // 3) Рёбра: используем все вопросы (внутренние и внешние)
    const newEdges: Edge[] = [];
    questions.forEach((question) => {
      if (question.transitionRules) {
        question.transitionRules.forEach((rule) => {
          const targetQuestion = allQuestions.find((q) => q.id === rule.nextQuestionId);
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

    // 4) Дефолтные рёбра для линейного перехода в пределах текущего списка
    questions.forEach((question, index) => {
      const nextQuestion = questions[index + 1];
      if (nextQuestion && (!question.transitionRules || question.transitionRules.length === 0)) {
        newEdges.push({
          id: `e-${question.id}-${nextQuestion.id}-default`,
          source: question.id,
          target: nextQuestion.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [questions, allQuestions, selectedQuestionId, readOnly, pages, onDelete, onEditClick, setNodes, setEdges, groupIdToChildren, childIdToParentId]);

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
  };
} 