import React from 'react';
import { Question, ParallelBranchSettings } from '@survey-platform/shared-types';
import { Label } from '@/components/ui/label';
import { renderQuestion } from '../utils/questionRenderer';

interface ParallelGroupContentProps {
  question: Question;
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  settings: ParallelBranchSettings;
  index: number;
  surveyId?: string;
}

export function ParallelGroupContent({
  question,
  questions,
  answers,
  onAnswerChange,
  settings,
  index,
  surveyId,
}: ParallelGroupContentProps) {
  return (
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
                index, // Передаем индекс для правильного получения ответов
                surveyId
              )}
            </div>
          ))}
      </div>
    </div>
  );
} 