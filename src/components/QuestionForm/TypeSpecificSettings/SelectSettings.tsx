import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectSettings, DEFAULT_SELECT_SETTINGS } from '@survey-platform/shared-types';
import { Question } from '@survey-platform/shared-types';

interface SelectSettingsProps {
  settings: SelectSettings;
  onChange: (settings: SelectSettings) => void;
  readOnly?: boolean;
  question?: Question; // Нужен для получения списка опций
}

export function SelectSettings({ settings, onChange, readOnly = false, question }: SelectSettingsProps) {
  const currentSettings = { ...DEFAULT_SELECT_SETTINGS, ...settings };

  const handlePlaceholderChange = (value: string) => {
    onChange({
      ...currentSettings,
      placeholder: value || undefined
    });
  };

  const handleDefaultOptionChange = (value: string) => {
    onChange({
      ...currentSettings,
      defaultOptionId: value === 'none' ? undefined : value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="placeholder">Текст подсказки</Label>
        <Input
          id="placeholder"
          value={currentSettings.placeholder || ''}
          onChange={(e) => handlePlaceholderChange(e.target.value)}
          placeholder="Выберите вариант"
          disabled={readOnly}
        />
        <p className="text-xs text-gray-500 mt-1">
          Текст, который будет отображаться когда не выбрано значение
        </p>
      </div>

      <div>
        <Label htmlFor="defaultOption">Вариант по умолчанию</Label>
        <Select
          value={currentSettings.defaultOptionId || 'none'}
          onValueChange={handleDefaultOptionChange}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без выбора по умолчанию</SelectItem>
            {question?.options?.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Этот вариант будет автоматически выбран при отображении вопроса
        </p>
      </div>
    </div>
  );
} 