import React from 'react';
import { useFieldArray, Control, useWatch } from 'react-hook-form';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';
import { UseParallelBranchResult } from '@/types/question.types';
import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Pencil, Trash } from 'lucide-react';
import { PLACEHOLDERS, PARALLEL_DISPLAY_MODES } from '@/constants/question.constants';

interface ParallelBranchTabProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  parallelBranch: UseParallelBranchResult;
  allQuestions: Question[];
  control: Control<any>;
  currentQuestionId?: string;
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
  control,
  currentQuestionId,
  onEditSubQuestion,
  readOnly = false
}: ParallelBranchTabProps) {

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || readOnly) return;
    parallelBranch.reorderQuestions(result.source.index, result.destination.index);
  };

  // Фильтруем вопросы, чтобы исключить текущий и другие параллельные группы
  const availableQuestions = React.useMemo(() => {
    return allQuestions.filter(
      q =>
        q.id !== currentQuestionId &&
        q.type !== QUESTION_TYPES.ParallelGroup &&
        q.type !== 'resolution', // TODO: использовать QUESTION_TYPES.Resolution
    );
  }, [allQuestions, currentQuestionId]);

  // Фильтруем доступные вопросы
  const availableForSelection = availableQuestions.filter(q => 
    q.type !== QUESTION_TYPES.ParallelGroup && 
    q.id !== currentQuestionId && 
    !parallelBranch.questions.includes(q.id)
  );

  return (
    <TabsContent value="parallel" className="space-y-4">
      <div className="space-y-4">
        {/* Основные настройки ветки */}
        <div className="space-y-2">
          <Label htmlFor="branch-title">Название ветки</Label>
          <Input
            id="branch-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Введите название ветки"
            disabled={readOnly}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="branch-description">Описание ветки</Label>
          <Input
            id="branch-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Введите описание ветки"
            disabled={readOnly}
          />
        </div>

        {/* Настройки повторений */}
        <div className="space-y-2">
          <Label htmlFor="item-label">Название единицы повторения</Label>
          <Input
            id="item-label"
            value={parallelBranch.settings.itemLabel}
            onChange={(e) => parallelBranch.updateSettings({ itemLabel: e.target.value })}
            placeholder={PLACEHOLDERS.PARALLEL_ITEM_LABEL}
            disabled={readOnly}
          />
        </div>

        {/* Минимальное и максимальное количество */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-items">Минимальное количество</Label>
            <Input
              id="min-items"
              type="number"
              min={1}
              value={parallelBranch.settings.minItems}
              onChange={(e) => parallelBranch.updateSettings({ 
                minItems: parseInt(e.target.value) || 1
              })}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-items">Максимальное количество</Label>
            <Input
              id="max-items"
              type="number"
              min={parallelBranch.settings.minItems}
              max={30}
              value={parallelBranch.settings.maxItems ?? 5}
              onChange={(e) => parallelBranch.updateMaxItems(parseInt(e.target.value) || 1)}
              disabled={readOnly}
            />
            {parallelBranch.maxItemsError && (
              <div className="text-xs text-red-500 mt-1">{parallelBranch.maxItemsError}</div>
            )}
          </div>
        </div>

        {/* Режим отображения */}
        <div className="space-y-2">
          <Label htmlFor="display-mode">Режим отображения</Label>
          <Select
            value={parallelBranch.settings.displayMode}
            onValueChange={(value: 'sequential' | 'tabs') => 
              parallelBranch.updateSettings({ displayMode: value })
            }
            disabled={readOnly}
          >
            <SelectTrigger id="display-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARALLEL_DISPLAY_MODES.map(mode => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Настройки поля количества */}
        <div className="space-y-2">
          <Label htmlFor="count-label">Заголовок поля "Сколько повторений?"</Label>
          <Input
            id="count-label"
            value={parallelBranch.settings.countLabel || ''}
            onChange={e => parallelBranch.updateSettings({ countLabel: e.target.value })}
            placeholder={PLACEHOLDERS.COUNT_LABEL}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="count-description">Описание поля</Label>
          <Input
            id="count-description"
            value={parallelBranch.settings.countDescription || ''}
            onChange={e => parallelBranch.updateSettings({ countDescription: e.target.value })}
            placeholder={PLACEHOLDERS.COUNT_DESCRIPTION}
            disabled={readOnly}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="countRequired"
            checked={parallelBranch.settings.countRequired || false}
            onCheckedChange={checked => parallelBranch.updateSettings({ countRequired: !!checked })}
            disabled={readOnly}
          />
          <Label htmlFor="countRequired">Обязательное поле</Label>
        </div>

        {/* Список вопросов для повторения */}
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
              value=""
              onValueChange={(value) => {
                if (value) {
                  parallelBranch.addQuestion(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Добавить вопрос" />
              </SelectTrigger>
              <SelectContent>
                {availableForSelection.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </TabsContent>
  );
}