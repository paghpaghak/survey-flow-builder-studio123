import React from 'react';
import { Question } from '@survey-platform/shared-types';
import { TabsContent } from '@/components/ui/tabs';
import { useParallelBranchLogic } from './hooks/useParallelBranchLogic';
import { 
  BranchBasicSettings, 
  BranchRepeatSettings, 
  BranchCountSettings, 
  BranchQuestionsList 
} from './components';

interface ParallelBranchTabProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  parallelBranch: ReturnType<typeof import('@/hooks/useParallelBranch').useParallelBranch>;
  allQuestions: Question[];
  currentQuestionId?: string;
  currentPageId?: string;
  onEditSubQuestion?: (questionId: string) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Компонент вкладки настроек параллельной ветки.
 * Включает все настройки для создания и управления параллельными группами вопросов.
 * </summary>
 */
export function ParallelBranchTab({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  parallelBranch,
  allQuestions,
  currentQuestionId,
  currentPageId,
  onEditSubQuestion,
  readOnly = false
}: ParallelBranchTabProps) {
  const { availableQuestions, availableForSelection } = useParallelBranchLogic({
    allQuestions,
    currentQuestionId,
    currentPageId,
    parallelQuestions: parallelBranch.questions,
  });

  return (
    <TabsContent value="parallel" className="space-y-4">
      <div className="space-y-4">
        <BranchBasicSettings
          title={title}
          description={description}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          readOnly={readOnly}
        />

        <BranchRepeatSettings
          parallelBranch={parallelBranch}
          readOnly={readOnly}
        />

        <BranchCountSettings
          parallelBranch={parallelBranch}
          readOnly={readOnly}
        />

        <BranchQuestionsList
          parallelBranch={parallelBranch}
          availableQuestions={availableQuestions}
          availableForSelection={availableForSelection}
          onEditSubQuestion={onEditSubQuestion}
          readOnly={readOnly}
        />
      </div>
    </TabsContent>
  );
}