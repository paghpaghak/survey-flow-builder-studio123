import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SurveyPreview } from '@/components/survey-preview/SurveyPreview';
import type { Question, Page } from '@survey-platform/shared-types';

interface SurveyEditorPreviewProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  pages: Page[];
}

export function SurveyEditorPreview({ open, onClose, questions, pages }: SurveyEditorPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full">
        <SurveyPreview questions={questions} pages={pages} />
      </DialogContent>
    </Dialog>
  );
} 