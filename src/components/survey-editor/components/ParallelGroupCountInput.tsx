import React from 'react';
import { ParallelBranchSettings } from '@survey-platform/shared-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ParallelGroupCountInputProps {
  settings: ParallelBranchSettings;
  countKey: string;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export function ParallelGroupCountInput({
  settings,
  countKey,
  answers,
  onAnswerChange,
  activeTab,
  setActiveTab,
}: ParallelGroupCountInputProps) {
  return (
    <div className="space-y-2">
      <Label>{settings.countLabel || 'Сколько повторений?'}</Label>
      {settings.countDescription && (
        <p className="text-sm text-gray-500">{settings.countDescription}</p>
      )}
      <Input
        type="number"
        min={settings.minItems || 1}
        max={settings.maxItems || 30}
        value={answers[countKey] || ''}
        onChange={(e) => {
          const newCount = parseInt(e.target.value) || 0;
          onAnswerChange(countKey, e.target.value);
          // Сброс активной вкладки если новое количество меньше текущей
          if (newCount > 0 && activeTab >= newCount) {
            setActiveTab(0);
          }
        }}
        required={!!settings.countRequired}
        placeholder="Введите число"
      />
    </div>
  );
} 