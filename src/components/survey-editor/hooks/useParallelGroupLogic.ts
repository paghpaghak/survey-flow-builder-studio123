import React from 'react';
import { Question, ParallelBranchSettings } from '@survey-platform/shared-types';

interface UseParallelGroupLogicProps {
  question: Question;
  answers: Record<string, any>;
  repeatIndexes?: Record<string, number>;
  mode?: 'preview' | 'taking';
}

export function useParallelGroupLogic({
  question,
  answers,
  repeatIndexes,
  mode = 'preview'
}: UseParallelGroupLogicProps) {
  // Настройки параллельной группы
  const settings: ParallelBranchSettings = {
    sourceQuestionId: '',
    itemLabel: 'Элемент',
    displayMode: 'tabs', // По умолчанию используем вкладки
    minItems: 1,
    maxItems: 5,
    ...((question.settings || {}) as Partial<ParallelBranchSettings>),
  };

  // Вычисляемые значения
  const countKey = question.id + '_count';
  const count = Number(answers[countKey]) || 0;
  const hasSubQuestions = Array.isArray(question.parallelQuestions) && question.parallelQuestions.length > 0;
  
  // Локальный state для текущей активной вкладки
  const [activeTab, setActiveTab] = React.useState(0);
  const repeatIndex = repeatIndexes?.[question.id] ?? activeTab;

  // Логирование (можно вынести в отладочный режим)
  React.useEffect(() => {
    console.log('[ParallelGroupRenderer] Рендер параллельной группы', { 
      questionId: question.id, 
      count, 
      activeTab, 
      repeatIndex, 
      hasSubQuestions,
      settings,
      mode 
    });
  }, [question.id, count, activeTab, repeatIndex, hasSubQuestions, settings, mode]);

  // Сброс активной вкладки при изменении количества
  React.useEffect(() => {
    if (count > 0 && activeTab >= count) {
      setActiveTab(0);
    }
  }, [count, activeTab]);

  // Логирование подвопросов
  React.useEffect(() => {
    if (hasSubQuestions) {
      question.parallelQuestions?.forEach((qId, idx) => {
        // Этот эффект можно оптимизировать или убрать в production
        console.log('[ParallelGroupRenderer] Ветка', idx, 'ID:', qId);
      });
    }
  }, [hasSubQuestions, question.parallelQuestions]);

  return {
    settings,
    countKey,
    count,
    hasSubQuestions,
    activeTab,
    setActiveTab,
    repeatIndex,
  };
} 