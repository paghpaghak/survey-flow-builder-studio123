import { useState, useEffect, useCallback, useRef } from 'react';
import { useSurveyStore } from '@/store/survey-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Edit, Trash, ArrowUpDown, Settings, History, BarChart2, UserSquare2, MoreVertical } from 'lucide-react';
import type { Survey, SurveyStatus } from '@survey-platform/shared-types';
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
import { useSurveyFilters } from '@/hooks/useSurveyFilters';
import { duplicateSurvey } from '@/utils/surveyUtils';
import { SurveyTableRow } from './SurveyTableRow';

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
  
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    statusFilter,
    setStatusFilter,
    filteredAndSortedSurveys: sortedSurveys,
  } = useSurveyFilters(allSurveys);

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
    const newSurveyData = duplicateSurvey(survey);
    const created = await createSurvey(newSurveyData as Survey);
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
              {sortedSurveys.map((survey, idx) => (
                <SurveyTableRow
                  key={survey.id || `survey-idx-${idx}`}
                  survey={survey}
                  index={idx}
                  isAdmin={isAdmin}
                  showDeleteDialog={showDeleteDialog}
                  showVersionHistory={showVersionHistory}
                  getStatusColor={getStatusColor}
                  handleDuplicateSurvey={handleDuplicateSurvey}
                  setShowDeleteDialog={setShowDeleteDialog}
                  deleteSurvey={deleteSurvey}
                  reloadSurveys={reloadSurveys}
                  setShowVersionHistory={setShowVersionHistory}
                  setEditingSurvey={setEditingSurvey}
                />
              ))}
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
