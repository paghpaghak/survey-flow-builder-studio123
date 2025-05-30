import { SurveyQuestion, QuestionType, QuestionTypeSettings, ParallelBranchSettings } from "@/types/survey";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface QuestionEditDialogProps {
  question: SurveyQuestion;
  availableQuestions: SurveyQuestion[];
  onClose: () => void;
  onSave?: (updatedQuestion: SurveyQuestion) => void;
  readOnly?: boolean;
}

/**
 * <summary>
 * Диалог редактирования вопроса опроса.
 * Позволяет настраивать текст, тип, варианты, правила перехода и дополнительные параметры вопроса.
 * </summary>
 * <param name="question">Редактируемый вопрос</param>
 * <param name="availableQuestions">Список всех доступных вопросов для переходов</param>
 * <param name="onClose">Закрытие диалога</param>
 * <param name="onSave">Сохранение изменений</param>
 * <param name="readOnly">Режим только для просмотра</param>
 */
export default function QuestionEditDialog({
  question,
  availableQuestions,
  onClose,
  onSave,
  readOnly = false
}: QuestionEditDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<QuestionType>(QuestionType.Text);
  const [required, setRequired] = useState(false);
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<{ id: string; text: string }[]>([]);
  const [transitionRules, setTransitionRules] = useState<{ id: string; answer: string; nextQuestionId: string; }[]>([]);
  const [settings, setSettings] = useState<QuestionTypeSettings[QuestionType] | undefined>();
  const [currentQuestion, setCurrentQuestion] = useState<SurveyQuestion | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // --- состояние для параллельной ветки ---
  const [parallelSettings, setParallelSettings] = useState<ParallelBranchSettings>(
    (settings as ParallelBranchSettings) || {
      sourceQuestionId: '',
      itemLabel: '',
      displayMode: 'sequential',
      minItems: 1,
      maxItems: 5,
    }
  );
  const [parallelQuestions, setParallelQuestions] = useState<string[]>(
    currentQuestion?.parallelQuestions || []
  );

  // Получаем только числовые вопросы для выбора источника
  const numberQuestions = availableQuestions.filter(q => 
    q.type === QuestionType.Number && q.id !== currentQuestion?.id
  );

  // Получаем числовой вопрос-источник по id
  const numberQuestion = availableQuestions.find(q => q.id === parallelSettings.sourceQuestionId);

  // Получаем вопросы, доступные для включения в группу
  const availableGroupQuestions = availableQuestions.filter(q => 
    q.type !== QuestionType.ParallelGroup && 
    q.id !== currentQuestion?.id && 
    q.id !== parallelSettings.sourceQuestionId
  );

  const [maxItemsError, setMaxItemsError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setTitle(question.title);
      setType(question.type);
      setRequired(question.required ?? false);
      setDescription(question.description || "");
      setOptions(question.options || []);
      setTransitionRules(question.transitionRules || []);
      setSettings(question.settings);
      setCurrentQuestion(question);
      setParallelQuestions(question.parallelQuestions || []);
    }
  }, [question]);

  useEffect(() => {
    if (type === QuestionType.ParallelGroup) {
      let maxItems = 5;
      if (question.settings && typeof (question.settings as any).maxItems === 'number') {
        maxItems = (question.settings as any).maxItems;
        if (maxItems > 30) {
          maxItems = 30;
          setMaxItemsError('Максимум 30 повторений');
          console.log('[useEffect] maxItems > 30, сбрасываю к 30');
        } else {
          setMaxItemsError(null);
        }
      }
      setParallelSettings({
        ...(question.settings as ParallelBranchSettings) || {},
        maxItems,
        minItems: (question.settings as any)?.minItems ?? 1,
        itemLabel: (question.settings as any)?.itemLabel ?? '',
        displayMode: (question.settings as any)?.displayMode ?? 'sequential',
      });
      console.log('[useEffect] parallelSettings инициализированы:', {
        maxItems,
        minItems: (question.settings as any)?.minItems ?? 1
      });
    }
  }, [question, type]);

  function handleSave() {
    if (maxItemsError) return;
    if (!currentQuestion) return;

    const validTransitionRules = transitionRules.filter(
      rule => rule.answer && rule.nextQuestionId
    );

    const regularQuestion: SurveyQuestion = {
      ...currentQuestion,
      title,
      description,
      type,
      required,
      settings,
      options: needsOptions(type) ? options : undefined,
      transitionRules: validTransitionRules.length > 0 ? validTransitionRules : undefined,
    };

    // Для параллельной ветки сохраняем вложенные вопросы и настройки
    if (type === QuestionType.ParallelGroup) {
      regularQuestion.parallelQuestions = parallelQuestions;
      regularQuestion.settings = parallelSettings;
    }

    onSave?.(regularQuestion);
    onClose();
  }

  function needsOptions(type: QuestionType): boolean {
    return [QuestionType.Radio, QuestionType.Checkbox, QuestionType.Select].includes(type);
  }

  function handleTypeChange(newType: QuestionType) {
    setType(newType);
    if ([QuestionType.Radio, QuestionType.Checkbox, QuestionType.Select].includes(newType)) {
      setOptions((prev) => prev.length > 0 ? prev : [
        { id: crypto.randomUUID(), text: 'Вариант 1' },
        { id: crypto.randomUUID(), text: 'Вариант 2' }
      ]);
    } else {
      setOptions([]);
    }
    switch (newType) {
      case QuestionType.Date:
        setSettings({});
        break;
      case QuestionType.Phone:
        setSettings({
          countryCode: '+7',
          mask: '(###) ###-##-##'
        });
        break;
      default:
        setSettings(undefined);
    }
  }

  function renderTypeSpecificSettings() {
    switch (type) {
      case QuestionType.Phone:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Код страны</Label>
              <Input 
                value={(settings as QuestionTypeSettings[QuestionType.Phone])?.countryCode || '+7'}
                onChange={e => setSettings({
                  ...(settings as QuestionTypeSettings[QuestionType.Phone]),
                  countryCode: e.target.value
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Маска (#)</Label>
              <Input 
                value={(settings as QuestionTypeSettings[QuestionType.Phone])?.mask || '(###) ###-##-##'}
                onChange={e => setSettings({
                  ...(settings as QuestionTypeSettings[QuestionType.Phone]),
                  mask: e.target.value
                })}
              />
            </div>
          </div>
        );

      case QuestionType.Date:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Формат даты</Label>
              <Select 
                value={(settings as QuestionTypeSettings[QuestionType.Date])?.format || 'DD.MM.YYYY'}
                onValueChange={value => setSettings({
                  ...(settings as QuestionTypeSettings[QuestionType.Date]),
                  format: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите формат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  function handleParallelDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(parallelQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setParallelQuestions(items);
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mb-4">
                {readOnly ? 'Просмотр вопроса' : 'Настройка и логика вопроса'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Настройка</TabsTrigger>
                {type === QuestionType.ParallelGroup ? (
                  <TabsTrigger value="parallel">Параллельная ветка</TabsTrigger>
                ) : (
                  <TabsTrigger value="logic">Логика</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Заголовок</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>

                  <div>
                    <Label>Описание</Label>
                    <div className="flex items-center gap-2 mb-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" type="button" disabled={readOnly}>
                            Вставить переменную
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                          {availableQuestions
                            .filter(q => q.id !== question.id && q.type !== QuestionType.ParallelGroup)
                            .map(q => (
                              <DropdownMenuItem
                                key={q.id}
                                onClick={() => {
                                  // Вставка плейсхолдера в позицию курсора
                                  const placeholder = `{{${q.id}}}`;
                                  const input = document.getElementById('question-description-input') as HTMLInputElement;
                                  if (input) {
                                    const start = input.selectionStart || 0;
                                    const end = input.selectionEnd || 0;
                                    setDescription(
                                      description.slice(0, start) + placeholder + description.slice(end)
                                    );
                                    setTimeout(() => {
                                      input.focus();
                                      input.setSelectionRange(start + placeholder.length, start + placeholder.length);
                                    }, 0);
                                  } else {
                                    setDescription(description + placeholder);
                                  }
                                }}
                              >
                                {q.title}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Input
                      id="question-description-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="required"
                      checked={required}
                      onCheckedChange={setRequired}
                      disabled={readOnly}
                    />
                    <Label htmlFor="required">Обязательный вопрос</Label>
                  </div>

                  <div>
                    <Label>Тип вопроса</Label>
                    <Select
                      value={type}
                      onValueChange={handleTypeChange}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Тип вопроса" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={QuestionType.Text}>Текст</SelectItem>
                        <SelectItem value={QuestionType.Radio}>Один из списка</SelectItem>
                        <SelectItem value={QuestionType.Checkbox}>Несколько из списка</SelectItem>
                        <SelectItem value={QuestionType.Select}>Выпадающий список</SelectItem>
                        <SelectItem value={QuestionType.Date}>Дата</SelectItem>
                        <SelectItem value={QuestionType.Email}>Email</SelectItem>
                        <SelectItem value={QuestionType.Phone}>Телефон</SelectItem>
                        <SelectItem value={QuestionType.Number}>Число</SelectItem>
                        <SelectItem value={QuestionType.ParallelGroup}>Параллельная ветка</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {needsOptions(type) && (
                    <div className="space-y-2">
                      <Label>Варианты ответов</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto rounded border bg-muted px-2 py-2">
                        {options.map((option, idx) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <Input
                              value={option.text}
                              onChange={(e) => setOptions(options.map(opt => 
                                opt.id === option.id ? { ...opt, text: e.target.value } : opt
                              ))}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newOption = { id: crypto.randomUUID(), text: 'Новый вариант' };
                                setOptions([
                                  ...options.slice(0, idx + 1),
                                  newOption,
                                  ...options.slice(idx + 1)
                                ]);
                              }}
                              aria-label="Добавить вариант"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (options.length > 1) {
                                  setOptions(options.filter(opt => opt.id !== option.id));
                                }
                              }}
                              aria-label="Удалить вариант"
                              disabled={options.length === 1}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {renderTypeSpecificSettings()}

                  {/* Секция для параллельной ветки */}
                  {type === QuestionType.ParallelGroup && !readOnly && false && (
                    <div className="space-y-2">
                      <Button
                        variant="secondary"
                        onClick={() => setParallelQuestions([...parallelQuestions, crypto.randomUUID()])}
                      >
                        Настроить параллельную ветку
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {type === QuestionType.ParallelGroup ? (
                <TabsContent value="parallel" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Название ветки</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Введите название ветки"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Описание ветки</Label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Введите описание ветки"
                      />
                    </div>
                    {numberQuestion && (
                      <div className="space-y-2">
                        <Label>Вопрос-источник (количество повторений)</Label>
                        <Input
                          value={numberQuestion.title}
                          onChange={e => {/* обновление в store, если нужно */}}
                          placeholder="Введите заголовок числового вопроса"
                        />
                        <Input
                          value={numberQuestion.description || ''}
                          onChange={e => {/* обновление в store, если нужно */}}
                          placeholder="Описание (необязательно)"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Название единицы повторения</Label>
                      <Input
                        value={parallelSettings.itemLabel}
                        onChange={(e) => setParallelSettings({ ...parallelSettings, itemLabel: e.target.value })}
                        placeholder="Например: Ребенок, Питомец, Автомобиль"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Минимальное количество</Label>
                        <Input
                          type="number"
                          min={1}
                          value={parallelSettings.minItems}
                          onChange={(e) => setParallelSettings({ 
                            ...parallelSettings, 
                            minItems: parseInt(e.target.value) || 1
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Максимальное количество</Label>
                        <Input
                          key={parallelSettings.maxItems}
                          type="number"
                          min={parallelSettings.minItems}
                          max={30}
                          step={1}
                          value={parallelSettings.maxItems ?? 5}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (isNaN(val) || !e.target.value) val = 1;
                            if (val < parallelSettings.minItems) val = parallelSettings.minItems;
                            if (val > 30) {
                              setMaxItemsError('Максимум 30 повторений');
                              val = 30;
                            } else {
                              setMaxItemsError(null);
                            }
                            setParallelSettings({
                              ...parallelSettings,
                              maxItems: val
                            });
                          }}
                          onBlur={() => {
                            if (parallelSettings.maxItems && parallelSettings.maxItems > 30) {
                              setParallelSettings(ps => ({ ...ps, maxItems: 30 }));
                              setMaxItemsError('Максимум 30 повторений');
                            }
                          }}
                          onKeyDown={e => {
                            if (
                              (e.key === 'ArrowUp' || e.key === 'PageUp') &&
                              parallelSettings.maxItems >= 30
                            ) {
                              e.preventDefault();
                            }
                            if (
                              (e.key === 'ArrowDown' || e.key === 'PageDown') &&
                              parallelSettings.maxItems <= parallelSettings.minItems
                            ) {
                              e.preventDefault();
                            }
                          }}
                        />
                        {maxItemsError && <div className="text-xs text-red-500 mt-1">{maxItemsError}</div>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Режим отображения</Label>
                      <Select
                        value={parallelSettings.displayMode}
                        onValueChange={(value: 'sequential' | 'tabs') => 
                          setParallelSettings({ ...parallelSettings, displayMode: value })
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
                        value={parallelSettings.countLabel || ''}
                        onChange={e => setParallelSettings({ ...parallelSettings, countLabel: e.target.value })}
                        placeholder="Сколько повторений?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Описание поля</Label>
                      <Input
                        value={parallelSettings.countDescription || ''}
                        onChange={e => setParallelSettings({ ...parallelSettings, countDescription: e.target.value })}
                        placeholder="Описание (необязательно)"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="countRequired"
                        checked={parallelSettings.countRequired || false}
                        onCheckedChange={checked => setParallelSettings({ ...parallelSettings, countRequired: !!checked })}
                      />
                      <Label htmlFor="countRequired">Обязательное поле</Label>
                    </div>
                    <div className="space-y-2 w-full overflow-hidden">
                      <Label>Вопросы для повторения</Label>
                      <DragDropContext onDragEnd={handleParallelDragEnd}>
                        <Droppable droppableId="questions">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {parallelQuestions.map((questionId, index) => {
                                const q = availableQuestions.find(aq => aq.id === questionId);
                                if (!q) return null;
                                return (
                                  <Draggable key={q.id} draggableId={q.id} index={index}>
                                    {(provided) => {
                                      let style = provided.draggableProps.style;
                                      if (style && style.transform) {
                                        style = {
                                          ...style,
                                          transform: style.transform.replace(/translate\([^,]+,/, 'translate(0px,')
                                        };
                                      }
                                      return (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          style={style}
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
                                            onClick={() => setParallelQuestions(
                                              parallelQuestions.filter(id => id !== q.id)
                                            )}
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      );
                                    }}
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
                          if (value && !parallelQuestions.includes(value)) {
                            setParallelQuestions([...parallelQuestions, value]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Добавить вопрос" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroupQuestions
                            .filter(q => !parallelQuestions.includes(q.id))
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
                </TabsContent>
              ) : (
                <TabsContent value="logic" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Правила перехода</Label>
                    <div className="space-y-2">
                      {transitionRules.map((rule) => (
                        <div key={rule.id} className="flex items-center gap-2">
                          <Select 
                            value={rule.answer}
                            onValueChange={value => setTransitionRules(rules => 
                              rules.map(r => r.id === rule.id ? { ...r, answer: value } : r)
                            )}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Выберите ответ" />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select 
                            value={rule.nextQuestionId}
                            onValueChange={value => setTransitionRules(rules => 
                              rules.map(r => r.id === rule.id ? { ...r, nextQuestionId: value } : r)
                            )}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Следующий вопрос" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableQuestions
                                .filter(q => q.id !== currentQuestion?.id)
                                .map(q => (
                                  <SelectItem key={q.id} value={q.id}>
                                    {q.title}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTransitionRules(rules => rules.filter(r => r.id !== rule.id))}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setTransitionRules([...transitionRules, { 
                          id: crypto.randomUUID(),
                          answer: '',
                          nextQuestionId: ''
                        }])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить правило
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={onClose}>
              {readOnly ? 'Закрыть' : 'Отмена'}
            </Button>
            {!readOnly && onSave && (
              <Button onClick={handleSave}>Сохранить</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

