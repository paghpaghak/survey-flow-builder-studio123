import React, { useState } from 'react';
import { Question, QuestionType, ParallelGroupSettings } from '@/types/survey';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PagePreviewProps {
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
}

export function PagePreview({ questions, answers, onAnswerChange }: PagePreviewProps) {
  const [activeParallelGroups, setActiveParallelGroups] = useState<Record<string, number>>({});

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case QuestionType.ParallelGroup: {
        const settings = question.settings as ParallelGroupSettings;
        const sourceQuestion = questions.find(q => q.id === settings.sourceQuestionId);
        const count = answers[settings.sourceQuestionId] || 0;
        
        if (!sourceQuestion || count === 0) {
          return (
            <div className="text-gray-500 italic">
              Сначала ответьте на вопрос "{sourceQuestion?.title || 'количество повторений'}"
            </div>
          );
        }

        const parallelQuestions = (question.parallelQuestions || [])
          .map(qId => questions.find(q => q.id === qId))
          .filter((q): q is Question => q !== undefined);

        const activeIndex = activeParallelGroups[question.id] ?? 0;

        return (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveParallelGroups(prev => ({ ...prev, [question.id]: index }))}
                  className={`px-4 py-2 rounded-lg min-w-[120px] transition-colors ${
                    activeIndex === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {settings.itemLabel} {index + 1}
                </button>
              ))}
            </div>

            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-medium mb-4">
                {settings.itemLabel} {activeIndex + 1}
              </h3>
              <div className="space-y-4">
                {parallelQuestions.map(subQuestion => (
                  <div key={subQuestion.id} className="space-y-2">
                    <Label>
                      {subQuestion.title}
                      {subQuestion.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderQuestion({
                      ...subQuestion,
                      id: `${question.id}.${activeIndex}.${subQuestion.id}`
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case QuestionType.Text:
        return (
          <Input
            value={answers[question.id] || ''}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder="Введите ваш ответ"
          />
        );

      case QuestionType.Number:
        return (
          <Input
            type="number"
            value={answers[question.id] || ''}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder="Введите число"
          />
        );

      case QuestionType.Radio:
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onValueChange={(value) => onAnswerChange(question.id, value)}
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
                  checked={answers[question.id]?.includes(option.id) || false}
                  onCheckedChange={(checked) => {
                    const currentAnswers = answers[question.id] || [];
                    onAnswerChange(
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
            value={answers[question.id] || ''}
            onValueChange={(value) => onAnswerChange(question.id, value)}
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
              selected={answers[question.id]}
              onSelect={(value) => onAnswerChange(question.id, value)}
              className="rounded-md border"
            />
            {answers[question.id] && (
              <p className="text-sm text-gray-500">
                Выбрано: {format(answers[question.id], dateSettings.format || 'dd.MM.yyyy')}
              </p>
            )}
          </div>
        );

      case QuestionType.Email:
        return (
          <Input
            type="email"
            value={answers[question.id] || ''}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder="example@domain.com"
          />
        );

      case QuestionType.Phone:
        const phoneSettings = question.settings as { countryCode?: string; mask?: string };
        return (
          <div className="flex gap-2">
            <Input
              className="w-20"
              value={phoneSettings.countryCode || '+7'}
              disabled
            />
            <IMaskInput
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              mask={phoneSettings.mask || '(000) 000-00-00'}
              value={answers[question.id] || ''}
              onAccept={(value) => onAnswerChange(question.id, value)}
              placeholder="(999) 999-99-99"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <div className="space-y-1">
            <Label className="text-base">
              {question.title}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {question.description && (
              <p className="text-sm text-gray-500">{question.description}</p>
            )}
          </div>
          {renderQuestion(question)}
        </div>
      ))}
    </div>
  );
} 