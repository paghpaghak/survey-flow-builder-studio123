import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import React from 'react';

interface SurveyEditorToolbarProps {
  onBack: () => void;
  onPreview: () => void;
  isPreviewOpen: boolean;
  isLoading?: boolean;
  // Можно добавить пропсы для фильтров, сортировки и создания опроса
}

export function SurveyEditorToolbar({ onBack, onPreview, isPreviewOpen, isLoading }: SurveyEditorToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <Button variant="ghost" className="gap-1" onClick={onBack} disabled={isLoading}>
        <ArrowLeft className="h-4 w-4" /> Назад
      </Button>
      <div className="flex gap-2">
        {/* Здесь могут быть фильтры, сортировка и другие элементы управления */}
        <Button variant="outline" onClick={onPreview} disabled={isPreviewOpen || isLoading}>
          <Eye className="h-4 w-4 mr-1" /> Предпросмотр
        </Button>
        {/* <Button>+ Новый опрос</Button> */}
      </div>
    </div>
  );
} 