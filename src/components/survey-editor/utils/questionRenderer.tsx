import React from 'react';
import { Question, QUESTION_TYPES } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IMaskInput } from 'react-imask';
import { format } from 'date-fns';

/**
 * Переиспользуемая функция для рендеринга отдельного вопроса
 * Поддерживает все типы вопросов кроме ParallelGroup
 */
export function renderQuestion(
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