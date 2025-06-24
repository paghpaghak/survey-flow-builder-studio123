import React from 'react';
import { Question, ParallelBranchSettings } from '@survey-platform/shared-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParallelGroupContent } from './ParallelGroupContent';

interface ParallelGroupTabsProps {
  question: Question;
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  settings: ParallelBranchSettings;
  count: number;
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export function ParallelGroupTabs({
  question,
  questions,
  answers,
  onAnswerChange,
  settings,
  count,
  activeTab,
  setActiveTab,
}: ParallelGroupTabsProps) {
  return (
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
          <ParallelGroupContent
            question={question}
            questions={questions}
            answers={answers}
            onAnswerChange={onAnswerChange}
            settings={settings}
            index={index}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
} 