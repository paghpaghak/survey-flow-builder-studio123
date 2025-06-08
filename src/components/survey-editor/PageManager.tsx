import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Page } from '@/types/survey';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, GripVertical, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PageManagerProps {
  pages: Page[];
  onUpdatePages: (pages: Page[]) => void;
  onSelectPage: (pageId: string) => void;
  selectedPageId?: string;
}

interface SortablePageItemProps {
  page: Page;
  isSelected: boolean;
  onSelect: () => void;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  isDragging: boolean;
  availableQuestions: any[];
  onUpdatePages: (pages: Page[]) => void;
  pages: Page[];
}

function SortablePageItem({ page, isSelected, onSelect, onTitleChange, onDelete, isDragging, availableQuestions, onUpdatePages, pages }: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: page.id,
    data: page
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : undefined;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [description, setDescription] = useState(page.description || '');
  const [descriptionPosition, setDescriptionPosition] = useState(page.descriptionPosition || 'after');
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Синхронизируем локальный стейт с актуальными данными страницы при каждом открытии модалки
  useEffect(() => {
    if (isEditOpen) {
      setDescription(page.description || '');
      setDescriptionPosition(page.descriptionPosition || 'after');
    }
  }, [isEditOpen, page.description, page.descriptionPosition]);

  function handleInsertVariable(questionId: string) {
    if (!descriptionRef.current) return;
    const textarea = descriptionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = description.slice(0, start);
    const after = description.slice(end);
    const variable = `{{${questionId}}}`;
    setDescription(before + variable + after);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          'p-3 mb-2 select-none transition-all duration-200',
          isSelected ? 'border-primary bg-primary/5 shadow-md' : 'hover:border-primary/50',
          isDragging ? 'opacity-50 rotate-2 scale-105 shadow-lg' : 'opacity-100',
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'cursor-grab active:cursor-grabbing p-1 rounded transition-colors',
              'hover:bg-primary/10',
              isSelected ? 'text-primary' : 'text-gray-400'
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Input
            value={page.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={cn(
              'flex-1 transition-colors',
              isSelected ? 'border-primary/50' : ''
            )}
            onClick={(e) => e.stopPropagation()}
            placeholder="Название страницы"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity',
              isSelected ? 'opacity-100' : ''
            )}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditOpen(true);
            }}
            className="transition-opacity"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
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
                      <DropdownMenuItem key={q.id} onClick={() => handleInsertVariable(q.id)}>
                        {q.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <textarea
                ref={descriptionRef}
                className="w-full border rounded p-2 min-h-[60px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Описание страницы (поддерживает переменные)"
              />
              <div className="mt-2">
                <label className="text-sm font-medium mr-2">Расположение описания:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={descriptionPosition}
                  onChange={e => setDescriptionPosition(e.target.value as 'before' | 'after')}
                >
                  <option value="before">Перед вопросами</option>
                  <option value="after">После вопросов</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  const updatedPages = pages.map(p =>
                    p.id === page.id
                      ? { ...p, title: page.title, description, descriptionPosition }
                      : p
                  );
                  console.log('[PageManager] Сохраняю страницу:', { id: page.id, title: page.title, description, descriptionPosition });
                  onUpdatePages(updatedPages);
                  setIsEditOpen(false);
                }}
              >Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </motion.div>
  );
}

/**
 * <summary>
 * Компонент управления страницами опроса (создание, удаление, сортировка, редактирование названий).
 * </summary>
 * <param name="pages">Список страниц</param>
 * <param name="onUpdatePages">Колбэк для обновления страниц</param>
 * <param name="onSelectPage">Колбэк для выбора страницы</param>
 * <param name="selectedPageId">ID выбранной страницы</param>
 */
export function PageManager({ pages, onUpdatePages, onSelectPage, selectedPageId }: PageManagerProps) {
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedId(null);
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      const updatedPages = [...pages];
      const [movedPage] = updatedPages.splice(oldIndex, 1);
      updatedPages.splice(newIndex, 0, movedPage);
      onUpdatePages(updatedPages);
    }
  };

  const handleAddPage = () => {
    const newPage: Page = {
      id: crypto.randomUUID(),
      title: `Страница ${pages.length + 1}`,
      questions: [],
      descriptionPosition: 'after',
    };
    onUpdatePages([...pages, newPage]);
    onSelectPage(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) {
      toast({
        variant: "destructive",
        description: 'Нельзя удалить единственную страницу опроса'
      });
      return;
    }

    const pageToDelete = pages.find(p => p.id === pageId);
    if (pageToDelete) {
      setPageToDelete(pageToDelete);
    }
  };

  const confirmDeletePage = () => {
    if (!pageToDelete || pages.length <= 1) return;
    
    const updatedPages = pages.filter(p => p.id !== pageToDelete.id);
    onUpdatePages(updatedPages);
    setPageToDelete(null);
  };

  const handleTitleChange = (pageId: string, newTitle: string) => {
    const updatedPages = pages.map(p =>
      p.id === pageId ? { ...p, title: newTitle || 'Без названия' } : p
    );
    onUpdatePages(updatedPages);
  };

  return (
    <div className="w-full space-y-4 overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        modifiers={[
          (args) => {
            const transform = args.transform || { x: 0, y: 0, scaleX: 1, scaleY: 1 };
            return {
              ...transform,
              x: 0
            };
          }
        ]}
      >
        <SortableContext
          items={pages.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="w-full overflow-hidden">
            <AnimatePresence>
              {pages.map((page) => (
                <SortablePageItem
                  key={page.id}
                  page={page}
                  isSelected={page.id === selectedPageId}
                  onSelect={() => onSelectPage(page.id)}
                  onTitleChange={(title) => handleTitleChange(page.id, title)}
                  onDelete={() => handleDeletePage(page.id)}
                  isDragging={page.id === draggedId}
                  availableQuestions={pages.flatMap(p => p.questions)}
                  onUpdatePages={onUpdatePages}
                  pages={pages}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={!!pageToDelete} onOpenChange={() => setPageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление страницы</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить страницу "{pageToDelete?.title}"?
              <br />
              Если на странице есть вопросы, то они также будут удалены!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePage}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 