import React from 'react';
import { parsePlaceholders } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Question, QuestionType } from '@/types/survey';

interface PlaceholderTextProps {
  text: string;
  answers: Record<string, any>;
  questions?: Question[];
  maxLength?: number;
}

export function PlaceholderText({ text = '', answers, questions = [], maxLength = 40 }: PlaceholderTextProps) {
  // Защита от undefined/null
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeAnswers = answers && typeof answers === 'object' ? answers : {};
  const parts = parsePlaceholders(text);

  // Ещё больше логов для отладки
  console.log('[PlaceholderText] RENDER', { text, answers, questions });
  parts.forEach((part, i) => {
    console.log(`[PlaceholderText] part[${i}]`, part);
  });

  function renderValue(key: string, field?: string) {
    const value = safeAnswers[key];
    const question = safeQuestions.find(q => q.id === key);
    console.log('[PlaceholderText] key:', key, 'value:', value, 'question:', question);
    if (question && [QuestionType.Radio, QuestionType.Select].includes(question.type)) {
      console.log('[PlaceholderText] options:', question.options, 'value:', value, 'allQuestions:', safeQuestions, 'answers:', safeAnswers);
      const option = question.options?.find(opt => opt.id === value);
      if (option) return <span className="font-semibold text-blue-900">{option.text}</span>;
      return <span className="text-red-500">{String(value)} (нет текста)</span>;
    }
    if (question && question.type === QuestionType.Checkbox && Array.isArray(value)) {
      const texts = value.map((id: string) => question.options?.find(opt => opt.id === id)?.text).filter(Boolean);
      if (texts.length > 0) {
        const displayValue = texts.join(', ');
        console.log(`[PlaceholderText] RENDERED (checkbox):`, displayValue);
        if (displayValue.length > maxLength) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-[120px] align-bottom inline-block cursor-help border-b border-dotted border-gray-400">{displayValue.slice(0, maxLength)}…</span>
                </TooltipTrigger>
                <TooltipContent>{displayValue}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        return <span className="font-semibold text-blue-900">{displayValue}</span>;
      }
    }
    let displayValue = value;
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else if (typeof value === 'object' && field) {
      displayValue = value[field] ?? '—';
    }
    if (typeof displayValue !== 'string') displayValue = String(displayValue);
    if (displayValue.length > maxLength) {
      console.log(`[PlaceholderText] RENDERED (truncated):`, displayValue.slice(0, maxLength) + '…');
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-[120px] align-bottom inline-block cursor-help border-b border-dotted border-gray-400">{displayValue.slice(0, maxLength)}…</span>
            </TooltipTrigger>
            <TooltipContent>{displayValue}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    console.log(`[PlaceholderText] RENDERED (default):`, displayValue);
    return <span className="font-semibold text-blue-900">{displayValue}</span>;
  }

  return (
    <span>
      {parts.map((part, i) =>
        part.type === 'text'
          ? part.value
          : <span key={i}>{renderValue(part.key, part.field)}</span>
      )}
    </span>
  );
} 