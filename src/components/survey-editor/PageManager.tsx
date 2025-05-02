import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Page } from '@/types/survey';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
}

function SortablePageItem({ page, isSelected, onSelect, onTitleChange, onDelete, isDragging }: SortablePageItemProps) {
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
        </div>
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
      questions: []
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