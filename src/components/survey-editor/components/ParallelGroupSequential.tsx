import React from 'react';
import { Question, ParallelBranchSettings } from '@survey-platform/shared-types';
import { ParallelGroupContent } from './ParallelGroupContent';

interface ParallelGroupSequentialProps {
  question: Question;
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  settings: ParallelBranchSettings;
  count: number;
}

export function ParallelGroupSequential({
  question,
  questions,
  answers,
  onAnswerChange,
  settings,
  count,
}: ParallelGroupSequentialProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ParallelGroupContent
          key={index}
          question={question}
          questions={questions}
          answers={answers}
          onAnswerChange={onAnswerChange}
          settings={settings}
          index={index}
        />
      ))}
    </div>
  );
} 