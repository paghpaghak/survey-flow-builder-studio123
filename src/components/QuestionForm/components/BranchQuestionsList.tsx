import React from 'react';
import { Question } from '@survey-platform/shared-types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Pencil, Trash } from 'lucide-react';
import { useParallelBranch } from '@/hooks/useParallelBranch';

interface BranchQuestionsListProps {
  parallelBranch: ReturnType<typeof useParallelBranch>;
  availableQuestions: Question[];
  availableForSelection: Question[];
  onEditSubQuestion?: (questionId: string) => void;
  readOnly?: boolean;
}

export function BranchQuestionsList({
  parallelBranch,
  availableQuestions,
  availableForSelection,
  onEditSubQuestion,
  readOnly = false,
}: BranchQuestionsListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || readOnly) return;
    parallelBranch.reorderQuestions(result.source.index, result.destination.index);
  };

  return (
    <div className="space-y-2">
      <Label>Вопросы для повторения</Label>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {parallelBranch.questions.map((questionId, index) => {
                const q = availableQuestions.find(aq => aq.id === questionId);
                if (!q) return null;
                return (
                  <Draggable key={q.id} draggableId={q.id} index={index} isDragDisabled={readOnly}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2 bg-white p-2 rounded border"
                      >
                        {!readOnly && (
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{q.title}</div>
                          <div className="text-sm text-gray-500">{q.type}</div>
                        </div>
                        {!readOnly && (
                          <>
                            {onEditSubQuestion && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditSubQuestion(q.id)}
                                className="text-gray-500 hover:text-primary"
                                title="Редактировать вопрос"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <button
                              onClick={() => parallelBranch.removeQuestion(q.id)}
                              title="Удалить из ветки"
                              className="text-red-500 hover:text-red-700 p-1 transition-colors"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* Селект для добавления вопросов */}
      {!readOnly && availableForSelection.length > 0 && (
        <Select
          value="placeholder"
          onValueChange={(value) => {
            if (value && value !== 'placeholder') {
              parallelBranch.addQuestion(value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Добавить вопрос" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="placeholder" value="placeholder" disabled>
              Добавить вопрос
            </SelectItem>
            {availableForSelection.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                {q.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 