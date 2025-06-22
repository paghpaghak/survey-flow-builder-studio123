import React from 'react';
import { Page, Question, QUESTION_TYPES } from '@survey-platform/shared-types';
import { cn } from '@/lib/utils';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, Trash, ChevronDown, ChevronRight, Repeat2, Pencil, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SortableQuestionNode } from './SortableQuestionNode';
import { SortableParallelGroupNode } from './SortableParallelGroupNode';

// We need to pass a lot of props from the main TreeView.
// This is acceptable for now to avoid premature context creation.
interface PageNodeProps {
  page: Page;
  pages: Page[];
  questions: Question[];
  selectedPageId?: string;
  selectedQuestionId?: string;
  onSelectPage: (pageId: string) => void;
  onSelectQuestion: (questionId: string | undefined) => void;
  onUpdatePageTitle?: (pageId: string, newTitle: string) => void;
  onUpdateQuestionTitle?: (questionId: string, newTitle: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onDeletePage?: (pageId: string) => void;
  onUpdatePageDescription?: (pageId: string, newDescription: string, position: string) => void;
  onEditResolution?: (resolution: Question) => void;

  // State from useSidebarState hook
  editingPageId: string | null;
  setEditingPageId: (id: string | null) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (id: string | null) => void;
  editingQuestionTitle: string;
  setEditingQuestionTitle: (title: string) => void;
  expandedGroups: Record<string, boolean>;
  setExpandedGroups: (groups: Record<string, boolean> | ((g: Record<string, boolean>) => Record<string, boolean>)) => void;
  expandedPages: Record<string, boolean>;
  setExpandedPages: (pages: Record<string, boolean> | ((p: Record<string, boolean>) => Record<string, boolean>)) => void;
  confirmDeleteParallelId: string | null;
  setConfirmDeleteParallelId: (id: string | null) => void;
  editPageId: string | null;
  setEditPageId: (id: string | null) => void;
  editDescription: string;
  setEditDescription: (desc: string) => void;
  descriptionPosition: string;
  setDescriptionPosition: (pos: string) => void;
  descriptionRefs: React.MutableRefObject<Record<string, HTMLTextAreaElement | null>>;
  handleInsertVariable: (questionId: string, pageId: string) => void;
}

export const PageNode: React.FC<PageNodeProps> = ({
  page,
  pages,
  questions,
  selectedPageId,
  selectedQuestionId,
  onSelectPage,
  onSelectQuestion,
  onUpdatePageTitle,
  onUpdateQuestionTitle,
  onDeleteQuestion,
  onDeletePage,
  onUpdatePageDescription,
  onEditResolution,
  editingPageId,
  setEditingPageId,
  editingTitle,
  setEditingTitle,
  editingQuestionId,
  setEditingQuestionId,
  editingQuestionTitle,
  setEditingQuestionTitle,
  expandedGroups,
  setExpandedGroups,
  expandedPages,
  setExpandedPages,
  confirmDeleteParallelId,
  setConfirmDeleteParallelId,
  editPageId,
  setEditPageId,
  editDescription,
  setEditDescription,
  descriptionPosition,
  setDescriptionPosition,
  descriptionRefs,
  handleInsertVariable,
}) => {
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
    </div>
  );
}; 