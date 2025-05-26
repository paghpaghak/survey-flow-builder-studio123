import React, { useState } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import { Page, Question } from '@/types/survey';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical, Trash } from 'lucide-react';

interface SidebarTreeViewProps {
  pages: Page[];
  questions: Question[];
  selectedPageId?: string;
  selectedQuestionId?: string;
  onSelectPage: (pageId: string) => void;
  onSelectQuestion: (questionId: string | undefined) => void;
  onQuestionOrderChange?: (questions: Question[]) => void;
  onUpdatePageTitle?: (pageId: string, newTitle: string) => void;
  onUpdateQuestionTitle?: (questionId: string, newTitle: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onDeletePage?: (pageId: string) => void;
}

type TreeNodeData = {
  id: string;
  type: 'page' | 'question';
  title: string;
  parentId?: string;
};

function buildTreeData(pages: Page[], questions: Question[]): TreeNodeData[] {
  const nodes: TreeNodeData[] = [];
  for (const page of pages) {
    nodes.push({ id: page.id, type: 'page', title: page.title });
    for (const q of questions.filter(q => q.pageId === page.id)) {
      nodes.push({ id: q.id, type: 'question', title: q.title || 'Без названия', parentId: page.id });
    }
  }
  return nodes;
}

function SortableQuestionNode({ node, style, isSelected, onSelect, onUpdateTitle, onDelete, editing, setEditing, editingTitle, setEditingTitle, number }: {
  node: any;
  style: React.CSSProperties;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateTitle?: (newTitle: string) => void;
  onDelete?: () => void;
  editing?: boolean;
  setEditing?: (v: boolean) => void;
  editingTitle?: string;
  setEditingTitle?: (v: string) => void;
  number?: number;
}) {
  if (!node?.data) return null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: node.data.id });

  const styleWithTransform = {
    ...(style ?? {}),
    ...(typeof CSS?.Transform?.toString === 'function' && transform != null
      ? { transform: CSS.Transform.toString(transform) }
      : {}),
    ...(typeof transition === 'string' ? { transition } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={styleWithTransform}
      onClick={onSelect}
      className={cn(
        'transition-all cursor-pointer select-none w-full group',
        'px-2 py-1 rounded text-sm flex items-center gap-0 bg-gray-50 border-l-4 pl-2',
        'border-b border-gray-200 mb-1',
        isSelected
          ? 'border-primary bg-primary/10 shadow border-l-blue-400'
          : 'hover:border-primary/30 border-l-blue-100',
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing w-4 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      {number !== undefined && (
        <span className="text-sm font-medium text-muted-foreground mr-1 w-4 text-right select-none">{number}.</span>
      )}
      {editing && setEditing && editingTitle !== undefined && setEditingTitle && onUpdateTitle ? (
        <input
          type="text"
          value={editingTitle}
          autoFocus
          onChange={e => setEditingTitle(e.target.value)}
          onBlur={() => {
            if (editingTitle.trim() && editingTitle !== node.data.title) {
              onUpdateTitle(editingTitle.trim());
            }
            setEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (editingTitle.trim() && editingTitle !== node.data.title) {
                onUpdateTitle(editingTitle.trim());
              }
              setEditing(false);
            } else if (e.key === 'Escape') {
              setEditing(false);
            }
          }}
          className="w-full px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium bg-white"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span
          className="truncate block flex-1 cursor-text"
          title={node.data.title}
          onClick={e => {
            e.stopPropagation();
            setEditing && setEditing(true);
            setEditingTitle && setEditingTitle(node.data.title);
          }}
        >
          {node.data.title}
        </span>
      )}
      {onDelete && (
        <button
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-600"
          title="Удалить вопрос"
          onClick={e => {
            e.stopPropagation();
            if (window.confirm('Удалить вопрос?')) onDelete();
          }}
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * <summary>
 * Дерево страниц и вопросов для навигации и управления структурой опроса.
 * </summary>
 * <param name="pages">Список страниц</param>
 * <param name="questions">Список вопросов</param>
 * <param name="selectedPageId">ID выбранной страницы</param>
 * <param name="selectedQuestionId">ID выбранного вопроса</param>
 * <param name="onSelectPage">Колбэк для выбора страницы</param>
 * <param name="onSelectQuestion">Колбэк для выбора вопроса</param>
 */
export const SidebarTreeView: React.FC<SidebarTreeViewProps> = ({
  pages,
  questions,
  selectedPageId,
  selectedQuestionId,
  onSelectPage,
  onSelectQuestion,
  onQuestionOrderChange,
  onUpdatePageTitle,
  onUpdateQuestionTitle,
  onDeleteQuestion,
  onDeletePage,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionTitle, setEditingQuestionTitle] = useState<string>('');
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeQuestion = questions.find(q => q.id === active.id);
    const overQuestion = questions.find(q => q.id === over.id);
    
    if (!activeQuestion || !overQuestion || activeQuestion.pageId !== overQuestion.pageId) return;

    const oldIndex = questions.findIndex(q => q.id === active.id);
    const newIndex = questions.findIndex(q => q.id === over.id);

    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(oldIndex, 1);
    newQuestions.splice(newIndex, 0, removed);

    onQuestionOrderChange?.(newQuestions);
  };

  return (
    <div className="p-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={event => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="space-y-4">
          {pages.map(page => {
            const pageQuestions = questions.filter(q => q.pageId === page.id);
            const isEditing = editingPageId === page.id;
            const isSelected = page.id === selectedPageId;
            return (
              <div
                key={page.id}
                className={cn(
                  'rounded-lg border bg-white shadow-sm mb-4 transition-all',
                  isSelected ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/40'
                )}
              >
                <div
                  onClick={() => {
                    onSelectPage(page.id);
                    onSelectQuestion(undefined);
                  }}
                  className={cn(
                    'flex items-center px-4 py-2 border-b rounded-t-lg transition-all cursor-pointer select-none w-full group',
                    isSelected ? 'bg-primary/10' : '',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        autoFocus
                        onChange={e => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim() && editingTitle !== page.title) {
                            onUpdatePageTitle?.(page.id, editingTitle.trim());
                          }
                          setEditingPageId(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (editingTitle.trim() && editingTitle !== page.title) {
                              onUpdatePageTitle?.(page.id, editingTitle.trim());
                            }
                            setEditingPageId(null);
                          } else if (e.key === 'Escape') {
                            setEditingPageId(null);
                          }
                        }}
                        className="w-full px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-base font-medium bg-white"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="truncate block cursor-text text-base font-semibold"
                        title={page.title}
                        onClick={e => {
                          e.stopPropagation();
                          setEditingPageId(page.id);
                          setEditingTitle(page.title);
                        }}
                      >
                        {page.title}
                      </span>
                    )}
                  </div>
                  {onDeletePage && pages.length > 1 && (
                    <button
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-600"
                      title="Удалить страницу"
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm('Удалить страницу?')) onDeletePage(page.id);
                      }}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="px-4 py-2">
                  {pageQuestions.length === 0 ? (
                    <div className="text-gray-400 italic text-sm">Нет вопросов</div>
                  ) : (
                    <SortableContext items={pageQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1">
                        {pageQuestions.map((q, idx) => (
                          <SortableQuestionNode
                            key={q.id}
                            node={{ data: { ...q, type: 'question', title: q.title || 'Без названия' } }}
                            style={{}}
                            isSelected={q.id === selectedQuestionId}
                            onSelect={() => onSelectQuestion(q.id)}
                            onUpdateTitle={newTitle => onUpdateQuestionTitle?.(q.id, newTitle)}
                            onDelete={onDeleteQuestion ? () => onDeleteQuestion(q.id) : undefined}
                            editing={editingQuestionId === q.id}
                            setEditing={v => {
                              setEditingQuestionId(v ? q.id : null);
                              setEditingQuestionTitle(q.title || '');
                            }}
                            editingTitle={editingQuestionId === q.id ? editingQuestionTitle : undefined}
                            setEditingTitle={setEditingQuestionTitle}
                            number={idx + 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeId && questions.find(q => q.id === activeId) ? (
            <SortableQuestionNode
              node={{
                data: {
                  ...questions.find(q => q.id === activeId),
                  type: 'question',
                  title: questions.find(q => q.id === activeId)?.title || 'Без названия',
                },
              }}
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)', background: 'white' }}
              isSelected={false}
              onSelect={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}; 