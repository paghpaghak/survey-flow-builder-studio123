import { useCallback, useRef } from 'react';
import { Node, OnNodesChange, OnConnect, Connection } from '@xyflow/react';
import { Question } from '@survey-platform/shared-types';
import { withDefaultTransitions, generateRuleId } from '../utils/flow-helpers';

interface UseNodeEventsProps {
  allQuestions: Question[];
  onUpdateQuestions?: (questions: Question[]) => void;
  onNodesChange: OnNodesChange;
}

export function useNodeEvents({
  allQuestions,
  onUpdateQuestions,
  onNodesChange,
}: UseNodeEventsProps) {
  const nodesPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  const callUpdateQuestionsWithDefaults = useCallback(
    (updatedQuestions: Question[]) => {
      const withDefaults = withDefaultTransitions(updatedQuestions);
      onUpdateQuestions?.(withDefaults);
    },
    [onUpdateQuestions]
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
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
    },
    [onNodesChange, allQuestions, callUpdateQuestionsWithDefaults]
  );

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
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
    },
    [allQuestions, callUpdateQuestionsWithDefaults, onUpdateQuestions]
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const { source, target } = params;
      if (!source || !target) return;
      const sourceQuestion = allQuestions.find(q => q.id === source);
      const targetQuestion = allQuestions.find(q => q.id === target);
      if (!sourceQuestion || !targetQuestion) return;

      const parallelGroups = allQuestions.filter(q => q.type === 'parallel_group');
      const parallelIds = parallelGroups.flatMap(g => g.parallelQuestions || []);
      if (parallelIds.includes(target)) {
        window.alert('Переходы на вложенные вопросы ветки не поддерживаются.');
        return;
      }

      const exists = sourceQuestion.transitionRules?.some(r => r.nextQuestionId === target);
      if (exists) return;

      const newRule = {
        id: generateRuleId(),
        nextQuestionId: target,
        answer: '',
      };
      
      const updatedQuestion = {
        ...sourceQuestion,
        transitionRules: [...(sourceQuestion.transitionRules || []), newRule],
      };

      const updatedQuestions = allQuestions.map(q =>
        q.id === source ? updatedQuestion : q
      );
      callUpdateQuestionsWithDefaults(updatedQuestions);
    },
    [allQuestions, callUpdateQuestionsWithDefaults]
  );

  return {
    handleNodesChange,
    onNodeDragStop,
    onConnect,
  };
} 