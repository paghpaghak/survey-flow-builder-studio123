import React from 'react';
import { Question, ParallelBranchSettings, QUESTION_TYPES } from '@survey-platform/shared-types';
import { Label } from '@/components/ui/label';
import { renderQuestion } from '../utils/questionRenderer';
import { ParallelGroupRenderer } from '../ParallelGroupRenderer';

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
  // Вспомогательные функции для иерархического хранения ответов родительской PG
  const parentId = question.id;
  const parentCount = Number(answers[`${parentId}_count`]) || 0;

  const updateParentStructSimple = (subId: string, value: any) => {
    const struct = (answers[parentId] as any) || { count: parentCount, answers: {} };
    const existing = struct.answers?.[subId] || [];
    const next = Array.isArray(existing) ? [...existing] : [];
    next[index] = value;
    const newStruct = {
      count: parentCount,
      answers: { ...(struct.answers || {}), [subId]: next },
    };
    onAnswerChange(parentId, newStruct);
  };

  const updateParentStructChildPg = (childPgId: string, key: string, value: any) => {
    // Обновляем структуру для дочерней PG: answers[parentId].answers[childPgId][parentIndex] = ParallelAnswer
    const struct = (answers[parentId] as any) || { count: parentCount, answers: {} };
    const childArray: any[] = Array.isArray(struct.answers?.[childPgId])
      ? [...struct.answers[childPgId]]
      : Array.from({ length: parentCount }, () => ({ count: 0, answers: {} }));
    const currentChild = childArray[index] || { count: 0, answers: {} };

    if (key === `${childPgId}_count`) {
      const unifiedCount = Number(value) || 0;
      // Применяем единый count ко всем итерациям родителя
      for (let i = 0; i < parentCount; i++) {
        const prev = childArray[i] || { count: 0, answers: {} };
        childArray[i] = { ...prev, count: unifiedCount };
      }
    } else {
      // Ожидаем плоский ключ вида `${subSubId}_${childIdx}`
      const match = key.match(/^(.*)_(\d+)$/);
      if (match) {
        const subSubId = match[1];
        const childIdx = parseInt(match[2], 10);
        const subList: any[] = Array.isArray(currentChild.answers?.[subSubId])
          ? [...currentChild.answers[subSubId]]
          : [];
        subList[childIdx] = value;
        const updated = {
          ...currentChild,
          answers: { ...(currentChild.answers || {}), [subSubId]: subList },
        };
        childArray[index] = updated;
      }
    }

    const newStruct = {
      count: parentCount,
      answers: { ...(struct.answers || {}), [childPgId]: childArray },
    };
    onAnswerChange(parentId, newStruct);
  };

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
              {subQuestion.type !== QUESTION_TYPES.ParallelGroup ? (
                renderQuestion(
                  subQuestion,
                  questions,
                  answers,
                  (id, value) => {
                    const flatKey = `${id}_${index}`;
                    onAnswerChange(flatKey, value); // совместимость
                    updateParentStructSimple(subQuestion.id, value); // иерархическая модель
                  },
                  index,
                  surveyId
                )
              ) : (
                <ParallelGroupRenderer
                  question={subQuestion}
                  questions={questions}
                  answers={answers}
                  onAnswerChange={(k, v) => {
                    // Проксируем в плоскую модель
                    onAnswerChange(k, v);
                    // и обновляем иерархическую модель в родителе
                    updateParentStructChildPg(subQuestion.id, k, v);
                  }}
                  mode="preview"
                  surveyId={surveyId}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
} 