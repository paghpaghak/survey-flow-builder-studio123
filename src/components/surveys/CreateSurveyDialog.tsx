import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useSurveyStore } from '@/store/survey-store';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

export function CreateSurveyDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { addSurvey, surveys } = useSurveyStore();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Пожалуйста, введите название опроса');
      return;
    }

    addSurvey(title, description);
    setTitle('');
    setDescription('');
    setOpen(false);
    toast.success('Опрос успешно создан');
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
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
          <Button onClick={handleSubmit}>Создать опрос</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
