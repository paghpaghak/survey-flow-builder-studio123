import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Survey, SurveyStatus } from '@survey-platform/shared-types';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash, MoreVertical, UserSquare2, History, BarChart2, Settings } from 'lucide-react';
import { SurveyVersionHistory } from './SurveyVersionHistory';

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "Архив",
};

interface SurveyTableRowProps {
  survey: Survey;
  index: number;
  isAdmin: boolean;
  showDeleteDialog: string | null;
  getStatusColor: (status: string) => string;
  handleDuplicateSurvey: (survey: Survey) => Promise<void>;
  setShowDeleteDialog: (id: string | null) => void;
  deleteSurvey: (id: string) => Promise<void>;
  reloadSurveys?: () => void;
  setEditingSurvey: (survey: Survey | null) => void;
  canEditSurvey: boolean;
  canDeleteSurvey: boolean;
  canViewResponses: boolean;
}

export function SurveyTableRow({
  survey,
  index,
  isAdmin,
  showDeleteDialog,
  getStatusColor,
  handleDuplicateSurvey,
  setShowDeleteDialog,
  deleteSurvey,
  reloadSurveys,
  setEditingSurvey,
  canEditSurvey,
  canDeleteSurvey,
  canViewResponses,
}: SurveyTableRowProps) {
  const navigate = useNavigate();
  const key = survey.id || `survey-idx-${index}`;
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  return (
    <TableRow key={key}>
      <TableCell className="text-center font-medium">{index + 1}</TableCell>
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
            {canEditSurvey && (
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
            )}
            {canEditSurvey && (
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
            )}
            {canDeleteSurvey && (
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
            )}
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
                {canEditSurvey && (
                  <DropdownMenuItem onClick={() => setVersionHistoryOpen(true)}>
                    <History className="h-4 w-4 mr-2" /> История версий
                  </DropdownMenuItem>
                )}
                {canEditSurvey && (
                  <DropdownMenuItem onClick={() => setEditingSurvey(survey)}>
                    <Settings className="h-4 w-4 mr-2" /> Настройки
                  </DropdownMenuItem>
                )}
                {canViewResponses && (
                  <DropdownMenuItem onClick={() => navigate(`/surveys/${survey.id}/results`)}>
                    <BarChart2 className="h-4 w-4 mr-2" /> Результаты
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>
        
        
        {/* Модальное окно истории версий */}
        <SurveyVersionHistory
          surveyId={survey.id}
          open={versionHistoryOpen}
          onOpenChange={setVersionHistoryOpen}
        />
      </TableCell>
    </TableRow>
  );
} 