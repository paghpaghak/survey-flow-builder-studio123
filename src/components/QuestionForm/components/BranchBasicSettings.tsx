import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BranchBasicSettingsProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  readOnly?: boolean;
}

export function BranchBasicSettings({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  readOnly = false,
}: BranchBasicSettingsProps) {
  return (
    <>
      {/* Основные настройки ветки */}
      <div className="space-y-2">
        <Label htmlFor="branch-title">Название ветки</Label>
        <Input
          id="branch-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Введите название ветки"
          disabled={readOnly}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="branch-description">Описание ветки</Label>
        <Input
          id="branch-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Введите описание ветки"
          disabled={readOnly}
        />
      </div>
    </>
  );
} 