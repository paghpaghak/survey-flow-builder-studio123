import React from 'react';
import type { Question } from '@survey-platform/shared-types';

interface ConfirmDeleteDialogProps {
  confirmDeleteParallelId: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  confirmDeleteParallelId,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  if (!confirmDeleteParallelId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <div className="font-bold mb-2">Удалить параллельную ветку?</div>
        <div className="mb-4 text-sm text-gray-600">
          Будут удалены все вложенные вопросы этой ветки. Это действие нельзя отменить.
        </div>
        <div className="flex gap-2 justify-end">
          <button 
            className="px-4 py-2 rounded bg-gray-100" 
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white"
            onClick={onConfirm}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
} 