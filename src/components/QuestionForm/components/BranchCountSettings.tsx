import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PLACEHOLDERS } from '@survey-platform/shared-types';
import { useParallelBranch } from '@/hooks/useParallelBranch';

interface BranchCountSettingsProps {
  parallelBranch: ReturnType<typeof useParallelBranch>;
  readOnly?: boolean;
}

export function BranchCountSettings({
  parallelBranch,
  readOnly = false,
}: BranchCountSettingsProps) {
  return (
    <>
      {/* Настройки поля количества */}
      <div className="space-y-2">
        <Label htmlFor="count-label">Заголовок поля "Сколько повторений?"</Label>
        <Input
          id="count-label"
          value={parallelBranch.settings.countLabel || ''}
          onChange={e => parallelBranch.updateSettings({ countLabel: e.target.value })}
          placeholder={PLACEHOLDERS.COUNT_LABEL}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="count-description">Описание поля</Label>
        <Input
          id="count-description"
          value={parallelBranch.settings.countDescription || ''}
          onChange={e => parallelBranch.updateSettings({ countDescription: e.target.value })}
          placeholder={PLACEHOLDERS.COUNT_DESCRIPTION}
          disabled={readOnly}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="countRequired"
          checked={parallelBranch.settings.countRequired || false}
          onCheckedChange={checked => parallelBranch.updateSettings({ countRequired: !!checked })}
          disabled={readOnly}
        />
        <Label htmlFor="countRequired">Обязательное поле</Label>
      </div>
    </>
  );
} 