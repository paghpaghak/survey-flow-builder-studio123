import React from 'react';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';
import type { Question } from '@survey-platform/shared-types';

interface AddResolutionButtonProps {
  questions: Question[];
  onAddResolution?: () => void;
}

export function AddResolutionButton({ questions, onAddResolution }: AddResolutionButtonProps) {
  if (!onAddResolution) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="mt-2 w-full"
      disabled={questions.some(q => q.type === 'resolution')}
      onClick={onAddResolution}
    >
      <Scale className="w-4 h-4 mr-1" /> Добавить резолюцию
    </Button>
  );
} 