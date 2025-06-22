import { useState, useEffect, useRef } from 'react';
import type { Survey } from '@survey-platform/shared-types';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSurveyStore } from '@/store/survey-store';
import { cn } from '@/lib/utils';

interface EditSurveyDialogProps {
  survey: Survey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSurveyDialog({ survey, open, onOpenChange }: EditSurveyDialogProps) {
  const [title, setTitle] = useState(survey.title);
  const [lastSavedTitle, setLastSavedTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description);
  const { updateSurvey } = useSurveyStore();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTitle(survey.title);
    setLastSavedTitle(survey.title);
    setDescription(survey.description);
  }, [survey.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  };

  const handleTitleBlur = () => {
    if (title !== lastSavedTitle) {
      updateSurvey({
        ...survey,
        title,
        description,
      });
      setLastSavedTitle(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (title !== lastSavedTitle) {
        updateSurvey({
          ...survey,
          title,
          description,
        });
        setLastSavedTitle(title);
      }
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }
    updateSurvey({
      ...survey,
      title,
      description,
    });
    setLastSavedTitle(title);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => {
        e.preventDefault();
        buttonRef.current?.focus();
      }}>
        <DialogHeader>
          <DialogTitle>Редактировать опрос</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              placeholder="Название опроса"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoFocus={false}
              className={cn("select-none focus:select-text")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Опишите цель данного опроса..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button ref={buttonRef} onClick={handleSubmit}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 