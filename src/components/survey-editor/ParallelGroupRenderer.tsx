import React from 'react';
import { Button } from '@/components/ui/button';
import { Question, QUESTION_TYPES, ParallelBranchSettings, QuestionType } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMaskInput } from 'react-imask';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ParallelGroupRendererProps {
  question: Question;
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  repeatIndexes?: Record<string, number>;
  onRepeatIndexChange?: (questionId: string, index: number) => void;
  mode?: 'preview' | 'taking'; // режим работы - предпросмотр или реальное прохождение
}

/**
 * Компонент для рендеринга параллельных групп вопросов
 * Поддерживает режимы вкладок и последовательного отображения
 */
export function ParallelGroupRenderer({ 
  question, 
  questions, 
  answers, 
  onAnswerChange,
  repeatIndexes,
  onRepeatIndexChange,
  mode = 'preview'
}: ParallelGroupRendererProps) {
  const settings: ParallelBranchSettings = {
    sourceQuestionId: '',
    itemLabel: 'Элемент',
    displayMode: 'tabs', // По умолчанию используем вкладки
    minItems: 1,
    maxItems: 5,
    ...((question.settings || {}) as Partial<ParallelBranchSettings>),
  };

  const countKey = question.id + '_count';
  const count = Number(answers[countKey]) || 0;
  const hasSubQuestions = Array.isArray(question.parallelQuestions) && question.parallelQuestions.length > 0;
  
  // Локальный state для текущей активной вкладки
  const [activeTab, setActiveTab] = React.useState(0);
  const repeatIndex = repeatIndexes?.[question.id] ?? activeTab;

  console.log('[ParallelGroupRenderer] Рендер параллельной группы', { 
    questionId: question.id, 
    count, 
    activeTab, 
    repeatIndex, 
    hasSubQuestions,
    settings,
    mode 
  });

  // Сброс активной вкладки при изменении количества
  React.useEffect(() => {
    if (count > 0 && activeTab >= count) {
      setActiveTab(0);
    }
  }, [count, activeTab]);

  if (hasSubQuestions) {
    question.parallelQuestions?.forEach((qId, idx) => {
      const subQ = questions.find(q => q.id === qId);
      if (subQ) {
        console.log('[ParallelGroupRenderer] Ветка', idx, 'Вопрос:', subQ);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Поле для ввода количества повторений */}
      <div className="space-y-2">
        <Label>{settings.countLabel || 'Сколько повторений?'}</Label>
        {settings.countDescription && (
          <p className="text-sm text-gray-500">{settings.countDescription}</p>
        )}
        <Input
          type="number"
          min={settings.minItems || 1}
          max={settings.maxItems || 30}
          value={answers[countKey] || ''}
          onChange={(e) => {
            const newCount = parseInt(e.target.value) || 0;
            onAnswerChange(countKey, e.target.value);
            // Сброс активной вкладки если новое количество меньше текущей
            if (newCount > 0 && activeTab >= newCount) {
              setActiveTab(0);
            }
          }}
          required={!!settings.countRequired}
          placeholder="Введите число"
        />
      </div>

      {/* Отображение вкладок/повторений только если есть вложенные вопросы и количество > 0 */}
      {count > 0 && hasSubQuestions ? (
        settings.displayMode === 'tabs' ? (
          <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(parseInt(value))}>
            <div className="w-full overflow-x-auto">
              <TabsList className="flex w-max min-w-full h-auto p-1" style={{ gridTemplateColumns: 'none' }}>
                {Array.from({ length: count }).map((_, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={index.toString()}
                    className="flex-shrink-0 px-3 py-2 min-w-[100px] text-sm"
                  >
                    {settings.itemLabel} {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {Array.from({ length: count }).map((_, index) => (
              <TabsContent key={index} value={index.toString()}>
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-medium mb-4">
                    {settings.itemLabel} {index + 1}
                  </h3>
                  <div className="space-y-4">
                    {(question.parallelQuestions || [])
                      .map(qId => questions.find(q => q.id === qId))
                      .filter((q): q is Question => q !== undefined)
                      .map(subQuestion => (
                        <div key={subQuestion.id} className="space-y-2">
                          <Label>
                            {subQuestion.title}
                            {subQuestion.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {subQuestion.description && (
                            <p className="text-sm text-gray-500">{subQuestion.description}</p>
                          )}
                          {renderQuestion(
                            subQuestion, 
                            questions, 
                            answers, 
                            (id, value) => {
                              // Сохраняем ответ с индексом повторения
                              const answerKey = `${id}_${index}`;
                              onAnswerChange(answerKey, value);
                            },
                            index // Передаем индекс для правильного получения ответов
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // Последовательный режим отображения
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 bg-card">
                <h3 className="font-medium mb-4">
                  {settings.itemLabel} {index + 1}
                </h3>
                <div className="space-y-4">
                  {(question.parallelQuestions || [])
                    .map(qId => questions.find(q => q.id === qId))
                    .filter((q): q is Question => q !== undefined)
                    .map(subQuestion => (
                      <div key={subQuestion.id} className="space-y-2">
                        <Label>
                          {subQuestion.title}
                          {subQuestion.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {subQuestion.description && (
                          <p className="text-sm text-gray-500">{subQuestion.description}</p>
                        )}
                        {renderQuestion(
                          subQuestion, 
                          questions, 
                          answers, 
                          (id, value) => {
                            // Сохраняем ответ с индексом повторения
                            const answerKey = `${id}_${index}`;
                            onAnswerChange(answerKey, value);
                          },
                          index // Передаем индекс для правильного получения ответов
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : count > 0 && !hasSubQuestions ? (
        <div className="text-sm text-gray-500 italic">Нет вложенных вопросов для повторения</div>
      ) : null}
    </div>
  );
}

/**
 * Функция для рендеринга отдельного вопроса
 */
function renderQuestion(
  question: Question,
  questions: Question[],
  answers: Record<string, any>,
  answerHandler: (id: string, value: any) => void,
  repeatIndex?: number // Добавляем параметр для индекса повторения
) {
  // Получаем ответ для текущего вопроса с учетом индекса повторения
  const answerKey = repeatIndex !== undefined ? `${question.id}_${repeatIndex}` : question.id;
  const currentAnswer = answers[answerKey];

  switch (question.type) {
    case QUESTION_TYPES.ParallelGroup: {
      // Этот случай не должен вызываться, так как ParallelGroup обрабатывается отдельно
      console.warn('[renderQuestion] ParallelGroup должен обрабатываться в ParallelGroupRenderer');
      return null;
    }

    case QUESTION_TYPES.Text:
      return (
        <Input
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите ваш ответ"
        />
      );

    case QUESTION_TYPES.Number:
      return (
        <Input
          type="number"
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите число"
        />
      );

    case QUESTION_TYPES.Radio:
      return (
        <RadioGroup
          value={currentAnswer}
          onValueChange={(value) => answerHandler(question.id, value)}
          className="flex flex-col gap-2"
        >
          {question.options?.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={`${question.id}-${option.id}-${repeatIndex}`} />
              <Label htmlFor={`${question.id}-${option.id}-${repeatIndex}`}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      );

    case QUESTION_TYPES.Checkbox:
      return (
        <div className="flex flex-col gap-2">
          {question.options?.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-${option.id}-${repeatIndex}`}
                checked={(currentAnswer as string[] | undefined)?.includes(option.id) || false}
                onCheckedChange={(checked) => {
                  const currentSelection = (currentAnswer as string[] | undefined) || [];
                  const newSelection = checked
                    ? [...currentSelection, option.id]
                    : currentSelection.filter(id => id !== option.id);
                  answerHandler(question.id, newSelection);
                }}
              />
              <Label htmlFor={`${question.id}-${option.id}-${repeatIndex}`}>{option.text}</Label>
            </div>
          ))}
        </div>
      );

    case QUESTION_TYPES.Select:
      return (
        <Select
          value={currentAnswer}
          onValueChange={(value) => answerHandler(question.id, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите ответ" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case QUESTION_TYPES.Date:
      const dateSettings = question.settings as { format?: string };
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !currentAnswer && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentAnswer ? format(new Date(currentAnswer), dateSettings?.format || 'PPP') : <span>Выберите дату</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentAnswer ? new Date(currentAnswer) : undefined}
              onSelect={(date) => answerHandler(question.id, date?.toISOString())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );

    case QUESTION_TYPES.Email:
      return (
        <Input
          type="email"
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="example@example.com"
        />
      );
    case QUESTION_TYPES.Phone:
      const phoneSettings = question.settings as { countryCode?: string; mask?: string };
      return (
        <IMaskInput
          mask={phoneSettings?.mask || '+{7} (000) 000-00-00'}
          value={currentAnswer || ''}
          onAccept={(value) => answerHandler(question.id, value)}
          placeholder="Введите номер телефона"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      );
    default:
      return <p>Неизвестный тип вопроса: {question.type}</p>;
  }
}