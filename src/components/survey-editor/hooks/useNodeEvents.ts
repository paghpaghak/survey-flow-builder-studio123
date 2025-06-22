import { useCallback } from 'react';
import { Node, Connection } from '@xyflow/react';
import { Question } from '@survey-platform/shared-types';

interface UseNodeEventsProps {
  allQuestions: Question[];
  onUpdateQuestions?: (questions: Question[]) => void;
}

export function useNodeEvents({ allQuestions, onUpdateQuestions }: UseNodeEventsProps) {
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (!onUpdateQuestions) return;
      const updatedQuestions = allQuestions.map(q => 
        q.id === node.id ? { ...q, position: node.position } : q
      );
      onUpdateQuestions(updatedQuestions);
    },
    [allQuestions, onUpdateQuestions]
  );

  const onConnect: (connection: Connection) => void = useCallback(
    (connection) => {
      if (!onUpdateQuestions) return;
      const { source, target } = connection;
      if (!source || !target) return;

      const updatedQuestions = allQuestions.map(q => {
        if (q.id === source) {
          const newRule = {
            id: `${source}-${target}`,
            targetQuestionId: target,
          };
          return {
            ...q,
            transitionRules: [...(q.transitionRules || []), newRule],
          };
        }
        return q;
      });
      onUpdateQuestions(updatedQuestions);
    },
    [allQuestions, onUpdateQuestions]
  );

  return { onNodeDragStop, onConnect };
} 