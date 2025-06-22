import React, { useState } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Page, Question, QuestionType } from '@survey-platform/shared-types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical, Trash, ChevronDown, ChevronRight, Repeat2, Pencil, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTreeData } from './sidebar/hooks/useTreeData';
import { SortableQuestionNode } from './sidebar/nodes/SortableQuestionNode';
import { RenderParallelBranch } from './sidebar/nodes/RenderParallelBranch';
import { SortableParallelGroupNode } from './sidebar/nodes/SortableParallelGroupNode';

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
  onUpdatePageDescription?: (pageId: string, newDescription: string, position: string) => void;
  onAddResolution?: () => void;
  onEditResolution?: (resolution: Question) => void;
}

type TreeNodeData = {
  id: string;
  type: 'page' | 'question' | 'parallel_group';
  title: string;
  parentId?: string;
};

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
  onUpdatePageDescription,
  onAddResolution,
  onEditResolution,
}) => {
  const { treeData } = useTreeData(pages, questions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionTitle, setEditingQuestionTitle] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  const [confirmDeleteParallelId, setConfirmDeleteParallelId] = useState<string | null>(null);
  const [editPageId, setEditPageId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState<string>('');
  const [descriptionPosition, setDescriptionPosition] = useState('before');
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  // Для textarea описания страниц: один ref-объект для всех страниц
  const descriptionRefs = React.useRef<Record<string, HTMLTextAreaElement | null>>({});

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeQuestion = questions.find(q => q.id === active.id);
    const overQuestion = questions.find(q => q.id === over.id);
    
    // --- Ограничения для параллельных веток ---
    // 1. Запрет перемещения вопроса внутрь/вне ветки
    const isActiveInParallel = questions.some(q => q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(active.id)));
    const isOverInParallel = questions.some(q => q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(over.id)));
    // 2. Запрет перемещения между разными ветками
    let activeParallelId = null;
    let overParallelId = null;
    for (const q of questions) {
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(active.id))) activeParallelId = q.id;
      if (q.type === QUESTION_TYPES.ParallelGroup && q.parallelQuestions?.includes(String(over.id))) overParallelId = q.id;
    }
    if (isActiveInParallel !== isOverInParallel || (activeParallelId && overParallelId && activeParallelId !== overParallelId)) {
      window.alert('Перемещение вопросов внутрь/вне параллельной ветки или между ветками запрещено.');
      return;
    }

    if (!activeQuestion || !overQuestion || activeQuestion.pageId !== overQuestion.pageId) return;

    const oldIndex = questions.findIndex(q => q.id === active.id);
    const newIndex = questions.findIndex(q => q.id === over.id);

    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(oldIndex, 1);
    newQuestions.splice(newIndex, 0, removed);

    onQuestionOrderChange?.(newQuestions);
  };

  function handleInsertVariable(questionId: string, pageId: string) {
    const textarea = descriptionRefs.current[pageId];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = editDescription.slice(0, start);
    const after = editDescription.slice(end);
    const variable = `{{${questionId}}}`;
    setEditDescription(before + variable + after);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  }

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
            // Собираем id всех вопросов, входящих в параллельные ветки на этой странице
            const parallelIds = new Set<string>();
            questions.forEach(q => {
              if (q.type === QUESTION_TYPES.ParallelGroup && Array.isArray(q.parallelQuestions)) {
                q.parallelQuestions.forEach(id => parallelIds.add(id));
              }
            });
            // Оставляем только вопросы, которые не входят в параллельные ветки
            const pageQuestions = questions.filter(q => q.pageId === page.id && !parallelIds.has(q.id));
            const isEditing = editingPageId === page.id;
            const isSelected = page.id === selectedPageId;
            const isPageExpanded = expandedPages[page.id] !== false;
            // Для модального окна редактирования описания страницы:
            const prevPages = pages.slice(0, pages.findIndex(p => p.id === page.id));
            const availableQuestions = prevPages.flatMap(p => questions.filter(q => q.pageId === p.id));
            // Проверяем, есть ли резолюция на этой странице
            const resolution = questions.find(q => q.pageId === page.id && q.type === 'resolution');
            if (resolution) {
              return (
                <div
                  key={resolution.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold mt-2 bg-blue-50 border border-blue-300',
                    selectedQuestionId === resolution.id ? 'border-blue-500 bg-blue-100' : ''
                  )}
                  style={{ cursor: 'pointer' }}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectQuestion(resolution.id);
                  }}
                  title="Резолюция"
                >
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span>Резолюция</span>
                  <button
                    className="ml-auto opacity-80 hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 flex-shrink-0"
                    title="Редактировать резолюцию"
                    onClick={e => {
                      e.stopPropagation();
                      if (typeof onEditResolution === 'function') {
                        onEditResolution(resolution);
                      }
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              );
            }
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
                  <span
                    className="mr-2 flex-shrink-0"
                    onClick={e => {
                      e.stopPropagation();
                      setExpandedPages(p => ({ ...p, [page.id]: !isPageExpanded }));
                    }}
                    title={isPageExpanded ? 'Скрыть вопросы страницы' : 'Показать вопросы страницы'}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {isPageExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </span>
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
                  <div className="flex items-center gap-2">
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
                    <button
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
                      title="Редактировать страницу"
                      onClick={e => {
                        e.stopPropagation();
                        setEditPageId(page.id);
                        setEditDescription(page.description || '');
                        setDescriptionPosition(
                          typeof page.descriptionPosition === 'string'
                            ? page.descriptionPosition
                            : 'after'
                        );
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2">
                  {isPageExpanded ? (
                    pageQuestions.length === 0 ? (
                      <div className="text-gray-400 italic text-sm">Нет вопросов</div>
                    ) : (
                      <SortableContext items={pageQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                          {pageQuestions.map((q, idx) => {
                            if (q.type === QUESTION_TYPES.ParallelGroup) {
                              const isExpanded = expandedGroups[q.id] || false;
                              return (
                                <SortableParallelGroupNode
                                  key={q.id}
                                  q={q}
                                  idx={idx}
                                  isSelected={q.id === selectedQuestionId}
                                  isExpanded={isExpanded}
                                  onSelect={() => onSelectQuestion(q.id)}
                                  onToggleExpand={() => setExpandedGroups(e => ({ ...e, [q.id]: !e[q.id] }))}
                                  questions={questions}
                                  selectedQuestionId={selectedQuestionId}
                                  onSelectQuestion={onSelectQuestion}
                                  onUpdateQuestionTitle={onUpdateQuestionTitle}
                                  onDeleteQuestion={onDeleteQuestion}
                                  editingQuestionId={editingQuestionId}
                                  setEditingQuestionId={setEditingQuestionId}
                                  editingQuestionTitle={editingQuestionTitle}
                                  setEditingQuestionTitle={setEditingQuestionTitle}
                                  setConfirmDeleteParallelId={setConfirmDeleteParallelId}
                                />
                              );
                            }
                            return (
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
                            );
                          })}
                        </div>
                      </SortableContext>
                    )
                  ) : null}
                </div>
                <Dialog open={editPageId === page.id} onOpenChange={() => setEditPageId(undefined)}>
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
                        ref={el => { descriptionRefs.current[page.id] = el; }}
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
                          console.log('[SidebarTreeView] onUpdatePageDescription called with:', {
                            id: page.id,
                            description: editDescription,
                            descriptionPosition
                          });
                          onUpdatePageDescription(page.id, editDescription, descriptionPosition);
                          setEditPageId(undefined);
                        }}
                      >Сохранить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
          {onAddResolution && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
              disabled={questions.some(q => q.type === 'resolution')}
              onClick={onAddResolution}
            >
              <Scale className="w-4 h-4 mr-1" /> Добавить резолюцию
            </Button>
          )}
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
      {/* Диалог подтверждения удаления ветки */}
      {confirmDeleteParallelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="font-bold mb-2">Удалить параллельную ветку?</div>
            <div className="mb-4 text-sm text-gray-600">
              Будут удалены все вложенные вопросы этой ветки. Это действие нельзя отменить.
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-100" onClick={() => setConfirmDeleteParallelId(null)}>Отмена</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white"
                onClick={() => {
                  if (onDeleteQuestion) {
                    // Удаляем ветку и все вложенные вопросы
                    const parallel = questions.find(q => q.id === confirmDeleteParallelId);
                    if (parallel) {
                      onDeleteQuestion(parallel.id);
                      (parallel.parallelQuestions || []).forEach(subId => onDeleteQuestion(subId));
                    }
                  }
                  setConfirmDeleteParallelId(null);
                }}
              >Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 