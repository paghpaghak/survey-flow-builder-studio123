import { useState, useEffect } from 'react';
import { useSurveyStore } from '@/store/survey-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Edit, Trash, ArrowUpDown, Settings, History } from 'lucide-react';
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

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  closed: "Закрыт",
};

const SORT_LABELS = {
  date: "Дате",
  title: "Названию",
  status: "Статусу",
};

export function SurveyList() {
  const { surveys, deleteSurvey, loadSurveys } = useSurveyStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilters, setStatusFilters] = useState<SurveyStatus[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  // Filter surveys based on search query and status filters
  const filteredSurveys = surveys.filter(survey => {
    const matchesQuery = survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(survey.status);
    return matchesQuery && matchesStatus;
  });

  // Sort filtered surveys
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

  const toggleStatusFilter = (status: SurveyStatus) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-yellow-500';
      case 'published': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getCurrentVersionQuestions = (survey: Survey) => {
    const currentVersion = survey.versions.find(v => v.version === survey.currentVersion);
    return currentVersion?.questions || [];
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
                  {(['draft', 'published', 'closed'] as SurveyStatus[]).map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={statusFilters.includes(status)}
                        onCheckedChange={() => toggleStatusFilter(status)}
                      />
                      <Label htmlFor={`status-${status}`} className="capitalize">
                        {STATUS_LABELS[status]}
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
              <DropdownMenuItem onClick={() => { setSortBy('date'); toggleSortDirection(); }}>
                Дате {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('title'); toggleSortDirection(); }}>
                Названию {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('status'); toggleSortDirection(); }}>
                Статусу {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CreateSurveyDialog />
        </div>
      </div>

      {sortedSurveys.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Количество вопросов</TableHead>
                <TableHead className="text-right">Действия</TableHead>
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
                    <TableCell className="font-medium">{survey.title}</TableCell>
                    <TableCell>{survey.description}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(survey.status)} text-white`}>
                        {STATUS_LABELS[survey.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(survey.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell>{getCurrentVersionQuestions(survey).length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSurvey(survey)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <SurveyVersionHistory surveyId={survey.id}>
                          <Button variant="ghost" size="sm">
                            <History className="h-4 w-4" />
                          </Button>
                        </SurveyVersionHistory>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog open={showDeleteDialog === survey.id} onOpenChange={(open) => setShowDeleteDialog(open ? survey.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
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
                              <Button variant="destructive" onClick={() => {
                                deleteSurvey(survey.id);
                                setShowDeleteDialog(null);
                              }}>Удалить</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
          {(searchQuery || statusFilters.length > 0) && (
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
          onOpenChange={(open) => !open && setEditingSurvey(null)}
        />
      )}
    </div>
  );
}
