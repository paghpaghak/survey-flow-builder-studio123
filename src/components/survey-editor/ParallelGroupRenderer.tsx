import React from 'react';
import { Question, QuestionType, ParallelBranchSettings } from '@/types/survey';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IMaskInput } from 'react-imask';
import { format } from 'date-fns';

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
    case QuestionType.ParallelGroup: {
      // Этот случай не должен вызываться, так как ParallelGroup обрабатывается отдельно
      console.warn('[renderQuestion] ParallelGroup должен обрабатываться в ParallelGroupRenderer');
      return null;
    }

    case QuestionType.Text:
      return (
        <Input
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите ваш ответ"
        />
      );

    case QuestionType.Number:
      return (
        <Input
          type="number"
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="Введите число"
        />
      );

    case QuestionType.Radio:
      return (
        <RadioGroup
          value={currentAnswer || ''}
          onValueChange={(value) => answerHandler(question.id, value)}
        >
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      );

    case QuestionType.Checkbox:
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={currentAnswer?.includes(option.id) || false}
                onCheckedChange={(checked) => {
                  const currentAnswers = currentAnswer || [];
                  answerHandler(
                    question.id,
                    checked
                      ? [...currentAnswers, option.id]
                      : currentAnswers.filter((id: string) => id !== option.id)
                  );
                }}
              />
              <Label htmlFor={option.id}>{option.text}</Label>
            </div>
          ))}
        </div>
      );

    case QuestionType.Select:
      return (
        <Select
          value={currentAnswer || ''}
          onValueChange={(value) => answerHandler(question.id, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите вариант" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case QuestionType.Date:
      const dateSettings = question.settings as { format?: string };
      return (
        <div className="space-y-2">
          <Calendar
            mode="single"
            selected={currentAnswer}
            onSelect={(value) => answerHandler(question.id, value)}
            className="rounded-md border"
          />
          {currentAnswer && (
            <p className="text-sm text-gray-500">
              Выбрано: {format(currentAnswer, dateSettings?.format || 'dd.MM.yyyy')}
            </p>
          )}
        </div>
      );

    case QuestionType.Email:
      return (
        <Input
          type="email"
          value={currentAnswer || ''}
          onChange={(e) => answerHandler(question.id, e.target.value)}
          placeholder="example@domain.com"
        />
      );

    case QuestionType.Phone:
      const phoneSettings = question.settings as { countryCode?: string; mask?: string };
      return (
        <div className="flex gap-2">
          <Input
            className="w-20"
            value={phoneSettings?.countryCode || '+7'}
            disabled
          />
          <IMaskInput
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            mask={phoneSettings?.mask || '(000) 000-00-00'}
            value={currentAnswer || ''}
            onAccept={(value) => answerHandler(question.id, value)}
            placeholder="(999) 999-99-99"
          />
        </div>
      );

    default:
      return null;
  }
}