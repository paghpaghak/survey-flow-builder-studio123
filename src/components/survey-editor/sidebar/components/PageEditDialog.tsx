import React from 'react';
import { Page, Question } from '@survey-platform/shared-types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PageEditDialogProps {
  page: Page;
  editPageId: string | null;
  editDescription: string;
  descriptionPosition: string;
  availableQuestions: Question[];
  setEditPageId: (id: string | null) => void;
  setEditDescription: (desc: string) => void;
  setDescriptionPosition: (pos: string) => void;
  onUpdatePageDescription?: (pageId: string, newDescription: string, position: string) => void;
  descriptionRefs: React.MutableRefObject<Record<string, HTMLTextAreaElement | null>>;
  handleInsertVariable: (questionId: string, pageId: string) => void;
}

export function PageEditDialog({
  page,
  editPageId,
  editDescription,
  descriptionPosition,
  availableQuestions,
  setEditPageId,
  setEditDescription,
  setDescriptionPosition,
  onUpdatePageDescription,
  descriptionRefs,
  handleInsertVariable,
}: PageEditDialogProps) {
  return (
    <Dialog open={editPageId === page.id} onOpenChange={() => setEditPageId(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать страницу</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">Описание страницы</label>
          <div className="flex items-center gap-2 mb-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" type="button">
                  Вставить переменную
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                {availableQuestions.map(q => (
                  <DropdownMenuItem key={q.id} onClick={() => handleInsertVariable(q.id, page.id)}>
                    {q.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <textarea
            ref={el => { if(el) descriptionRefs.current[page.id] = el; }}
            className="w-full border rounded p-2 min-h-[60px]"
            value={editDescription}
            onChange={e => setEditDescription(e.target.value)}
            placeholder="Описание страницы (поддерживает переменные)"
          />
          <div className="mt-2">
            <label className="text-sm font-medium mr-2">Расположение описания:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={descriptionPosition}
              onChange={e => setDescriptionPosition(e.target.value)}
            >
              <option value="before">Перед вопросами</option>
              <option value="after">После вопросов</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onUpdatePageDescription?.(page.id, editDescription, descriptionPosition);
              setEditPageId(null);
            }}
          >Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 