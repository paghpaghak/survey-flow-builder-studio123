import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SurveyQuestion, QuestionType } from '@/types/survey';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Trash } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

interface ParallelGroupEditDialogProps {
  question: SurveyQuestion;
  availableQuestions: SurveyQuestion[];
  onClose: () => void;
  onSave: (question: SurveyQuestion) => void;
}

interface ParallelGroupSettings {
  sourceQuestionId: string;
  itemLabel: string;
  minItems: number;
  maxItems?: number;
  displayMode: 'sequential' | 'tabs';
  countLabel?: string;
  countDescription?: string;
  countRequired?: boolean;
}

export function ParallelGroupEditDialog({
  question,
  availableQuestions,
  onClose,
  onSave
}: ParallelGroupEditDialogProps) {
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || '');
  const [settings, setSettings] = useState<ParallelGroupSettings>(
    (question.settings as ParallelGroupSettings) || {
      sourceQuestionId: '',
      itemLabel: '',
      displayMode: 'sequential',
      minItems: 1,
      maxItems: undefined
    }
  );
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(
    question.parallelQuestions || []
  );

  // Получаем только числовые вопросы для выбора источника
  const numberQuestions = availableQuestions.filter(q => 
    q.type === QuestionType.Number && q.id !== question.id
  );

  // Получаем числовой вопрос-источник по id
  const numberQuestion = availableQuestions.find(q => q.id === settings.sourceQuestionId);

  // Получаем вопросы, доступные для включения в группу
  const availableGroupQuestions = availableQuestions.filter(q => 
    q.type !== QuestionType.ParallelGroup && 
    q.id !== question.id && 
    q.id !== settings.sourceQuestionId
  );

  const handleSave = () => {
    let finalSettings = { ...settings };
    // Если sourceQuestionId не установлен, ищем числовой вопрос на странице и подставляем его id
    if (!finalSettings.sourceQuestionId) {
      const numberQuestion = availableQuestions.find(q => q.type === QuestionType.Number && q.id !== question.id);
      if (numberQuestion) {
        finalSettings.sourceQuestionId = numberQuestion.id;
      }
    }
    if (!finalSettings.itemLabel) {
      alert('Пожалуйста, укажите название единицы повторения');
      return;
    }
    if (selectedQuestions.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один вопрос для повторения');
      return;
    }
    const updatedQuestion: SurveyQuestion = {
      ...question,
      title,
      description,
      type: QuestionType.ParallelGroup,
      settings: finalSettings,
      parallelQuestions: selectedQuestions
    };
    onSave(updatedQuestion);
    onClose();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedQuestions(items);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройка параллельной группы</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название группы</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название группы"
            />
          </div>

          <div className="space-y-2">
            <Label>Описание</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите описание группы"
            />
          </div>

          {/* Блок для редактирования числового вопроса-источника */}
          {numberQuestion && (
            <div className="space-y-2">
              <Label>Вопрос-источник (количество повторений)</Label>
              <Input
                value={numberQuestion.title}
                onChange={e => {
                  numberQuestion.title = e.target.value;
                  // Если есть функция обновления вопроса в store, вызовите её здесь
                }}
                placeholder="Введите заголовок числового вопроса"
              />
              <Input
                value={numberQuestion.description || ''}
                onChange={e => {
                  numberQuestion.description = e.target.value;
                  // Если есть функция обновления вопроса в store, вызовите её здесь
                }}
                placeholder="Описание (необязательно)"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Название единицы повторения</Label>
            <Input
              value={settings.itemLabel}
              onChange={(e) => setSettings({ ...settings, itemLabel: e.target.value })}
              placeholder="Например: Ребенок, Питомец, Автомобиль"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Минимальное количество</Label>
              <Input
                type="number"
                min={1}
                value={settings.minItems}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  minItems: parseInt(e.target.value) || 1
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Максимальное количество</Label>
              <Input
                type="number"
                min={settings.minItems}
                value={settings.maxItems || ''}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  maxItems: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Режим отображения</Label>
            <Select
              value={settings.displayMode}
              onValueChange={(value: 'sequential' | 'tabs') => 
                setSettings({ ...settings, displayMode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Последовательный</SelectItem>
                <SelectItem value="tabs">Вкладки</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Заголовок поля "Сколько повторений?"</Label>
            <Input
              value={settings.countLabel || ''}
              onChange={e => setSettings({ ...settings, countLabel: e.target.value })}
              placeholder="Сколько повторений?"
            />
          </div>
          <div className="space-y-2">
            <Label>Описание поля</Label>
            <Input
              value={settings.countDescription || ''}
              onChange={e => setSettings({ ...settings, countDescription: e.target.value })}
              placeholder="Описание (необязательно)"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="countRequired"
              checked={settings.countRequired || false}
              onCheckedChange={checked => setSettings({ ...settings, countRequired: !!checked })}
            />
            <Label htmlFor="countRequired">Обязательное поле</Label>
          </div>

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
                    {selectedQuestions.map((questionId, index) => {
                      const q = availableQuestions.find(aq => aq.id === questionId);
                      if (!q) return null;

                      return (
                        <Draggable key={q.id} draggableId={q.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center gap-2 bg-white p-2 rounded border"
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{q.title}</div>
                                <div className="text-sm text-gray-500">
                                  {q.type}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedQuestions(
                                  selectedQuestions.filter(id => id !== q.id)
                                )}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
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

            <Select
              value=""
              onValueChange={(value) => {
                if (value && !selectedQuestions.includes(value)) {
                  setSelectedQuestions([...selectedQuestions, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Добавить вопрос" />
              </SelectTrigger>
              <SelectContent>
                {availableGroupQuestions
                  .filter(q => !selectedQuestions.includes(q.id))
                  .map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 