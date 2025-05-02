'use client';

import { Question, QuestionType } from '@/types/survey';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFormContext } from 'react-hook-form';

interface QuestionInputProps {
  question: Question;
  name: string;
}

export function QuestionInput({ question, name }: QuestionInputProps) {
  const { register, setValue, watch } = useFormContext();
  const value = watch(name);

  switch (question.type) {
    case QuestionType.Text:
      return (
        <Input
          {...register(name)}
          placeholder="Введите ответ"
          required={question.required}
        />
      );

    case QuestionType.Number:
      return (
        <Input
          type="number"
          {...register(name)}
          placeholder="Введите число"
          required={question.required}
          min={(question.settings as any)?.min}
          max={(question.settings as any)?.max}
          step={(question.settings as any)?.step}
        />
      );

    case QuestionType.Radio:
      return (
        <RadioGroup
          value={value}
          onValueChange={(val) => setValue(name, val)}
          className="space-y-2"
        >
          {question.options?.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={`${name}-${option.id}`} />
              <Label htmlFor={`${name}-${option.id}`}>{option.text}</Label>
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
                id={`${name}-${option.id}`}
                checked={value?.includes(option.id)}
                onCheckedChange={(checked) => {
                  const currentValue = value || [];
                  if (checked) {
                    setValue(name, [...currentValue, option.id]);
                  } else {
                    setValue(
                      name,
                      currentValue.filter((v: string) => v !== option.id)
                    );
                  }
                }}
              />
              <Label htmlFor={`${name}-${option.id}`}>{option.text}</Label>
            </div>
          ))}
        </div>
      );

    case QuestionType.Select:
      return (
        <Select
          value={value}
          onValueChange={(val) => setValue(name, val)}
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
      return (
        <Input
          type="date"
          {...register(name)}
          required={question.required}
        />
      );

    case QuestionType.Email:
      return (
        <Input
          type="email"
          {...register(name)}
          placeholder="Введите email"
          required={question.required}
        />
      );

    case QuestionType.Phone:
      return (
        <Input
          type="tel"
          {...register(name)}
          placeholder="Введите номер телефона"
          required={question.required}
        />
      );

    default:
      return (
        <Textarea
          {...register(name)}
          placeholder="Введите ответ"
          required={question.required}
        />
      );
  }
} 