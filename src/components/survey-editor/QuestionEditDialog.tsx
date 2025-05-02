import { SurveyQuestion, QuestionType, QuestionTypeSettings } from "@/types/survey";
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
import { ParallelGroupEditDialog } from './ParallelGroupEditDialog';

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
  const [showParallelGroupDialog, setShowParallelGroupDialog] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

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
    }
  }, [question]);

  function handleSave() {
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
    onSave?.(regularQuestion);
    onClose();
  }

  function needsOptions(type: QuestionType): boolean {
    return [QuestionType.Radio, QuestionType.Checkbox, QuestionType.Select].includes(type);
  }

  function handleTypeChange(newType: QuestionType) {
    setType(newType);
    if (newType === QuestionType.ParallelGroup) {
      setShowParallelGroupDialog(true);
    } else {
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

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
            <DialogTitle>
              {readOnly ? 'Просмотр вопроса' : 'Настройка и логика вопроса'}
            </DialogTitle>
        </DialogHeader>
          
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Настройка</TabsTrigger>
              <TabsTrigger value="logic">Логика</TabsTrigger>
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
                  <Input
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
                      <SelectItem value={QuestionType.ParallelGroup}>Параллельные ветки</SelectItem>
            </SelectContent>
          </Select>
                </div>

                {needsOptions(type) && (
                  <div className="space-y-2">
                    <Label>Варианты ответов</Label>
                    <div className="space-y-2">
                      {options.map((option) => (
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
                            onClick={() => setOptions(options.filter(opt => opt.id !== option.id))}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setOptions([...options, { id: crypto.randomUUID(), text: 'Новый вариант' }])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить вариант
                      </Button>
                    </div>
                  </div>
                )}

                {renderTypeSpecificSettings()}
              </div>
            </TabsContent>

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
          </Tabs>

        <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {readOnly ? 'Закрыть' : 'Отмена'}
          </Button>
            {!readOnly && onSave && (
              <Button onClick={handleSave}>Сохранить</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {showParallelGroupDialog && currentQuestion && (
        <ParallelGroupEditDialog
          question={currentQuestion}
          availableQuestions={availableQuestions}
          onClose={() => {
            setShowParallelGroupDialog(false);
          }}
          onSave={(updatedQuestion) => {
            onSave?.(updatedQuestion);
            setShowParallelGroupDialog(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

