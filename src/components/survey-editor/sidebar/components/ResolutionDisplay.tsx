import React from 'react';
import { Question } from '@survey-platform/shared-types';
import { cn } from '@/lib/utils';
import { Scale, Pencil } from 'lucide-react';

interface ResolutionDisplayProps {
  resolution: Question;
  selectedQuestionId?: string;
  onSelectQuestion: (questionId: string | undefined) => void;
  onEditResolution?: (resolution: Question) => void;
}

export function ResolutionDisplay({
  resolution,
  selectedQuestionId,
  onSelectQuestion,
  onEditResolution,
}: ResolutionDisplayProps) {
  return (
    <div
      key={resolution.id}
      className={cn(
        'flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold mt-2 bg-blue-50 border border-blue-300',
        selectedQuestionId === resolution.id ? 'border-blue-500 bg-blue-100' : ''
      )}
      style={{ cursor: 'pointer' }}
      onClick={e => {
        e.stopPropagation();
        onSelectQuestion(resolution.id);
      }}
      title="Резолюция"
    >
      <Scale className="w-4 h-4 text-blue-600" />
      <span>Резолюция</span>
      <button
        className="ml-auto opacity-80 hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 flex-shrink-0"
        title="Редактировать резолюцию"
        onClick={e => {
          e.stopPropagation();
          if (typeof onEditResolution === 'function') {
            onEditResolution(resolution);
          }
        }}
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
} 