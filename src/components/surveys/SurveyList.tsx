import { useState, useEffect, useCallback, useRef } from 'react';
import { useSurveyStore } from '@/store/survey-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Edit, Trash, ArrowUpDown, Settings, History, BarChart2, UserSquare2, MoreVertical } from 'lucide-react';
import { Survey, SurveyStatus } from '@/types/survey';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CreateSurveyDialog } from './CreateSurveyDialog';
import { EditSurveyDialog } from './EditSurveyDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SurveyVersionHistory } from './SurveyVersionHistory';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/hooks/useAuth';
import { createSurvey } from '@/lib/api';

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "Архив",
};

const SORT_LABELS = {
  date: "Дате",
  title: "Названию",
  status: "Статусу",
};

interface SurveyListProps {
  surveys: Survey[];
  reloadSurveys?: () => void;
  onSurveyCreated?: () => void;
}

export function SurveyList({ surveys, reloadSurveys, onSurveyCreated }: SurveyListProps) {
  const { deleteSurvey, loadSurveys } = useSurveyStore();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const prevCreateDialogOpen = useRef(false);
  const [localSurveys, setLocalSurveys] = useState<Survey[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const allSurveys = localSurveys.length > 0 ? [...localSurveys, ...surveys] : surveys;
  const filteredSurveys = allSurveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    if (sortBy === 'date') {
      return sortDirection === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'title') {
      return sortDirection === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else {
      return sortDirection === 'asc'
        ? (a.status || '').localeCompare(b.status || '')
        : (b.status || '').localeCompare(a.status || '');
    }
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-yellow-500';
      case 'published': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const handleSurveyCreated = async () => {
    if (onSurveyCreated) onSurveyCreated();
    if (reloadSurveys) await reloadSurveys();
    setCreateDialogOpen(false);
  };

  const handleSurveyEdited = async () => {
    if (reloadSurveys) await reloadSurveys();
    setEditingSurvey(null);
  };

  const handleDuplicateSurvey = async (survey: Survey) => {
    // Копируем только структуру, без ответов
    const newSurveyId = crypto.randomUUID();
    const original = survey;
    // Копируем все версии, страницы, вопросы, группы, настройки
    const newVersions = original.versions.map(version => {
      const pageIdMap: Record<string, string> = {};
      const questionIdMap: Record<string, string> = {};
      // Копируем вопросы с новыми id
      const newQuestions = version.questions.map(q => {
        const newQId = questionIdMap[q.id] || crypto.randomUUID();
        questionIdMap[q.id] = newQId;
        let parallelQuestions = undefined;
        if (q.parallelQuestions) {
          parallelQuestions = q.parallelQuestions.map(pid => questionIdMap[pid] || crypto.randomUUID());
        }
        return {
          ...q,
          id: newQId,
          pageId: pageIdMap[q.pageId] || q.pageId,
          parallelQuestions
        };
      });
      // Копируем страницы с новыми id и массивом вопросов (Question[])
      const newPages = version.pages.map(page => {
        const newPageId = crypto.randomUUID();
        pageIdMap[page.id] = newPageId;
        return {
          ...page,
          id: newPageId,
          questions: page.questions.map(q => {
            // Находим объект вопроса по id
            const questionObj = newQuestions.find(nq => nq.id === (questionIdMap[q.id] || q.id));
            return questionObj || q;
          })
        };
      });
      return {
        ...version,
        id: crypto.randomUUID(),
        version: 1,
        title: `${version.title || original.title} (Копия)` ,
        pages: newPages,
        questions: newQuestions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: undefined,
        status: 'draft' as SurveyStatus,
      };
    });
    const newSurvey = {
      ...original,
      id: newSurveyId,
      title: `${original.title} (Копия)` ,
      status: 'draft' as SurveyStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: newVersions,
      currentVersion: 1,
      publishedVersion: 1,
    };
    const created = await createSurvey(newSurvey);
    if (reloadSurveys) {
      await reloadSurveys();
    } else {
      setLocalSurveys(prev => [created, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-auto sm:min-w-[300px] flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Поиск опросов..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" /> Фильтры
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="font-medium mb-2">Статус</div>
                <div className="space-y-2">
                  {(['all', 'published', 'draft'] as ('all' | 'published' | 'draft')[]).map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={statusFilter === status}
                        onCheckedChange={() => setStatusFilter(status)}
                      />
                      <Label htmlFor={`status-${status}`} className="capitalize">
                        {status === 'all' ? 'Все опросы' : status === 'published' ? 'Опубликованные' : 'Черновики'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Сортировка: {SORT_LABELS[sortBy]} {sortDirection === 'asc' ? '↑' : '↓'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSortBy('date'); setSortDirection('asc'); }}>
                Дате {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('title'); setSortDirection('asc'); }}>
                Названию {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('status'); setSortDirection('asc'); }}>
                Статусу {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CreateSurveyDialog 
            onSurveyCreated={() => handleSurveyCreated()}
          />
        </div>
      </div>

      {sortedSurveys.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">№</TableHead>
                <TableHead className="w-[320px]">Название</TableHead>
                <TableHead className="w-[320px]">Описание</TableHead>
                {isAdmin && <TableHead>Статус</TableHead>}
                <TableHead className="w-[130px]">Дата создания</TableHead>
                <TableHead className="w-[150px]">Дата изменения</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSurveys.map((survey, idx) => {
                if (!survey.id) {
                  console.warn('Survey без id:', survey);
                }
                const key = survey.id || `survey-idx-${idx}`;
                return (
                  <TableRow key={key}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{survey.title}</TableCell>
                    <TableCell>{survey.description}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Badge className={`${getStatusColor(survey.status)} text-white`}>
                          {STATUS_LABELS[survey.status]}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>{new Date(survey.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{new Date(survey.updatedAt).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                                className="hover:text-blue-600 transition-colors"
                                title="Редактировать"
                                data-testid="edit-survey-btn"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleDuplicateSurvey(survey)}
                                className="hover:text-blue-600 transition-colors"
                                title="Дублировать"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </button>
                            </TooltipTrigger>
                          </Tooltip>
                          <Dialog open={showDeleteDialog === survey.id} onOpenChange={(open) => setShowDeleteDialog(open ? survey.id : null)}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                  <button className="text-red-600 hover:text-red-700 transition-colors" title="Удалить">
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </DialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Удалить</p>
                              </TooltipContent>
                            </Tooltip>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Удалить опрос</DialogTitle>
                                <DialogDescription>
                                  Вы действительно хотите удалить «{survey.title}»? Это действие нельзя отменить.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Отмена</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={async () => {
                                  await deleteSurvey(survey.id);
                                  setShowDeleteDialog(null);
                                  if (reloadSurveys) await reloadSurveys();
                                }}>Удалить</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="hover:text-blue-600 transition-colors" title="Ещё">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/take/${survey.id}`)}>
                                <UserSquare2 className="h-4 w-4 mr-2" /> Пройти опрос
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowVersionHistory(survey.id)}>
                                <History className="h-4 w-4 mr-2" /> История версий
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingSurvey(survey)}>
                                <Settings className="h-4 w-4 mr-2" /> Настройки
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/surveys/${survey.id}/results`)}>
                                <BarChart2 className="h-4 w-4 mr-2" /> Результаты
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {showVersionHistory === survey.id && (
                            <SurveyVersionHistory
                              surveyId={survey.id}
                            />
                          )}
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-lg font-medium text-gray-500 mb-4">Опросы не найдены</p>
          {(searchQuery || statusFilter !== 'all') && (
            <p className="text-gray-400 mb-6">
              Попробуйте изменить условия поиска или фильтры
            </p>
          )}
        </div>
      )}

      {editingSurvey && (
        <EditSurveyDialog
          survey={editingSurvey}
          open={!!editingSurvey}
          onOpenChange={(open) => {
            if (!open) handleSurveyEdited();
          }}
        />
      )}
    </div>
  );
}
