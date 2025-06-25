import React from 'react';
import { Question } from '@survey-platform/shared-types';
import { useParallelGroupLogic } from './hooks/useParallelGroupLogic';
import { ParallelGroupCountInput } from './components/ParallelGroupCountInput';
import { ParallelGroupTabs } from './components/ParallelGroupTabs';
import { ParallelGroupSequential } from './components/ParallelGroupSequential';

interface ParallelGroupRendererProps {
  question: Question;
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  repeatIndexes?: Record<string, number>;
  onRepeatIndexChange?: (questionId: string, index: number) => void;
  mode?: 'preview' | 'taking'; // режим работы - предпросмотр или реальное прохождение
  surveyId?: string;
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
  mode = 'preview',
  surveyId
}: ParallelGroupRendererProps) {
  const {
    settings,
    countKey,
    count,
    hasSubQuestions,
    activeTab,
    setActiveTab,
    repeatIndex,
  } = useParallelGroupLogic({
    question,
    answers,
    repeatIndexes,
    mode,
  });

  return (
    <div className="space-y-4">
      {/* Поле для ввода количества повторений */}
      <ParallelGroupCountInput
        settings={settings}
        countKey={countKey}
        answers={answers}
        onAnswerChange={onAnswerChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Отображение содержимого только если есть вложенные вопросы и количество > 0 */}
      {count > 0 && hasSubQuestions ? (
        settings.displayMode === 'tabs' ? (
          <ParallelGroupTabs
            question={question}
            questions={questions}
            answers={answers}
            onAnswerChange={onAnswerChange}
            settings={settings}
            count={count}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            surveyId={surveyId}
          />
        ) : (
          <ParallelGroupSequential
            question={question}
            questions={questions}
            answers={answers}
            onAnswerChange={onAnswerChange}
            settings={settings}
            count={count}
            surveyId={surveyId}
          />
        )
      ) : count > 0 && !hasSubQuestions ? (
        <div className="text-sm text-gray-500 italic">Нет вложенных вопросов для повторения</div>
      ) : null}
    </div>
  );
}

