import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useSurveyStore } from '@/store/survey-store';
import { toast } from '@/components/ui/sonner';

interface CreateSurveyDialogProps {
  onSurveyCreated?: () => void;
}

export function CreateSurveyDialog({ onSurveyCreated }: CreateSurveyDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { addSurvey } = useSurveyStore();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Пожалуйста, введите название опроса');
      return;
    }

    await addSurvey(title, description);
    setTitle('');
    setDescription('');
    setOpen(false);
    if (onSurveyCreated) onSurveyCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1" data-testid="create-survey-btn">
          <Plus className="h-4 w-4" /> Новый опрос
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создание нового опроса</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              placeholder="Название опроса"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
              data-testid="survey-title-input"
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
          <Button onClick={handleSubmit} data-testid="survey-create-confirm">Создать опрос</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
