import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { PLACEHOLDERS } from '@survey-platform/shared-types';
import { useParallelBranch } from '@/hooks/useParallelBranch';

interface BranchRepeatSettingsProps {
  parallelBranch: ReturnType<typeof useParallelBranch>;
  readOnly?: boolean;
}

export function BranchRepeatSettings({
  parallelBranch,
  readOnly = false,
}: BranchRepeatSettingsProps) {
  return (
    <>
      {/* Настройки повторений */}
      <div className="space-y-2">
        <Label htmlFor="item-label">Название единицы повторения</Label>
        <Input
          id="item-label"
          value={parallelBranch.settings.itemLabel}
          onChange={(e) => parallelBranch.updateSettings({ itemLabel: e.target.value })}
          placeholder={PLACEHOLDERS.PARALLEL_ITEM_LABEL}
          disabled={readOnly}
        />
      </div>

      {/* Минимальное и максимальное количество */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min-items">Минимальное количество</Label>
          <Input
            id="min-items"
            type="number"
            min={1}
            value={parallelBranch.settings.minItems}
            onChange={(e) => parallelBranch.updateSettings({ 
              minItems: parseInt(e.target.value) || 1
            })}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-items">Максимальное количество</Label>
          <Input
            id="max-items"
            type="number"
            min={parallelBranch.settings.minItems}
            max={30}
            value={parallelBranch.settings.maxItems ?? 5}
            onChange={(e) => parallelBranch.updateMaxItems(parseInt(e.target.value) || 1)}
            disabled={readOnly}
          />
          {parallelBranch.maxItemsError && (
            <div className="text-xs text-red-500 mt-1">{parallelBranch.maxItemsError}</div>
          )}
        </div>
      </div>

      {/* Режим отображения */}

    </>
  );
} 