'use client';

import React from 'react';
import { Question, QUESTION_TYPES, TextSettings, SelectSettings } from '@survey-platform/shared-types';
import { migrateMask } from '@/utils/maskMigration';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFormContext, Controller, FieldValues } from 'react-hook-form';
import InputMask from 'react-input-mask';

interface QuestionInputProps {
  question: Question;
  name: string;
}

interface SelectInputProps {
  question: Question;
  name: string;
}

function SelectInput({ question, name }: SelectInputProps) {
  const { setValue, watch } = useFormContext();
  const value = watch(name);
  const selectSettings = question.settings as SelectSettings | undefined;
  const placeholder = selectSettings?.placeholder || "Выберите вариант";

  // Устанавливаем дефолтное значение если оно есть и значение еще не выбрано
  React.useEffect(() => {
    if (selectSettings?.defaultOptionId && !value) {
      setValue(name, selectSettings.defaultOptionId);
    }
  }, [selectSettings?.defaultOptionId, value, setValue, name]);

  return (
    <Select
      value={value}
      onValueChange={(val) => setValue(name, val)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
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
}

export function QuestionInput({ question, name }: QuestionInputProps) {
  const { register, setValue, watch, control } = useFormContext();
  const value = watch(name);

  switch (question.type) {
    case QUESTION_TYPES.Text: {
      const textSettings = question.settings as TextSettings | undefined;
      // Если включена настройка showTitleInside, используем заголовок вопроса как placeholder
      const placeholder = textSettings?.showTitleInside 
        ? question.title 
        : (textSettings?.placeholder || "Введите ответ");
      const maxLength = textSettings?.maxLength;
      const inputMask = migrateMask(textSettings?.inputMask);

      if (inputMask) {
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <InputMask
                mask={inputMask}
                value={field.value || ''}
                onChange={field.onChange}
                maskChar="_"
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    placeholder={placeholder}
                    required={question.required}
                    maxLength={maxLength}
                  />
                )}
              </InputMask>
            )}
          />
        );
      }

      return (
        <Input
          {...register(name)}
          placeholder={placeholder}
          required={question.required}
          maxLength={maxLength}
        />
      );
    }

    case QUESTION_TYPES.Number:
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

    case QUESTION_TYPES.Radio:
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

    case QUESTION_TYPES.Checkbox:
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

    case QUESTION_TYPES.Select:
      return <SelectInput question={question} name={name} />;

    case QUESTION_TYPES.Date:
      return (
        <Input
          type="date"
          {...register(name)}
          required={question.required}
        />
      );

    case QUESTION_TYPES.Email:
      return (
        <Input
          type="email"
          {...register(name)}
          placeholder="Введите email"
          required={question.required}
        />
      );

    case QUESTION_TYPES.Phone:
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