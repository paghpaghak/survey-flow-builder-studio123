import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, RotateCcw, Plus, ArrowRightLeft, Edit, Eye } from 'lucide-react';
import { useSurveyStore } from '@/store/survey-store';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SurveyStatus } from '@/types/survey';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "Архив",
};

const STATUS_COLORS: Record<SurveyStatus, string> = {
  draft: "bg-yellow-50 text-yellow-700 border-yellow-200",
  published: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-gray-50 text-gray-700 border-gray-200",
};

interface SurveyVersionHistoryProps {
  surveyId: string;
  children?: React.ReactNode;
}

export function SurveyVersionHistory({ surveyId, children }: SurveyVersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const { surveys, revertToVersion, createNewVersion, updateSurvey } = useSurveyStore();
  const navigate = useNavigate();
  
  const survey = surveys.find(s => s.id === surveyId);
  if (!survey) return null;

  const handleRevert = (version: number) => {
    if (version === survey.currentVersion) {
      toast.error('Это текущая версия опроса');
      return;
    }

    revertToVersion(surveyId, version);
    toast.success('Версия опроса успешно восстановлена');
    setOpen(false);
  };

  const handleCreateVersion = () => {
    createNewVersion(surveyId);
  };

  const handleStatusChange = (versionId: string, newStatus: SurveyStatus) => {
    if (newStatus === 'published') {
      const hasPublishedVersion = survey.versions.some(v => 
        v.id !== versionId && v.status === 'published'
      );

      if (hasPublishedVersion) {
        toast.error('Может быть только одна опубликованная версия опроса');
        return;
      }
    }

    const updatedVersions = survey.versions.map(v => 
      v.id === versionId 
        ? { 
            ...v, 
            status: newStatus,
            publishedAt: newStatus === 'published' ? new Date() : v.publishedAt,
            archivedAt: newStatus === 'archived' ? new Date() : v.archivedAt
          }
        : v
    );

    const updatedSurvey = {
      ...survey,
      versions: updatedVersions,
      status: newStatus,
      publishedVersion: newStatus === 'published' ? updatedVersions.find(v => v.id === versionId)?.version : survey.publishedVersion
    };

    updateSurvey(updatedSurvey);
  };

  const handleCompareSelect = (version: number) => {
    if (selectedVersions.includes(version)) {
      setSelectedVersions(selectedVersions.filter(v => v !== version));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, version]);
    }
  };

  const handleEdit = (version: number) => {
    const updatedSurvey = {
      ...survey,
      currentVersion: version,
      updatedAt: new Date()
    };
    
    updateSurvey(updatedSurvey);
    setOpen(false);
    navigate(`/surveys/${surveyId}/edit`);
  };

  const handleView = (version: number) => {
    const updatedSurvey = {
      ...survey,
      currentVersion: version,
      updatedAt: new Date()
    };
    
    updateSurvey(updatedSurvey);
    setOpen(false);
    navigate(`/surveys/${surveyId}/view`);
  };

  const getVersionStatus = (version: number) => {
    if (version === survey.currentVersion) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Текущая
        </Badge>
      );
    }
    return null;
  };

  const renderVersionDiff = () => {
    if (selectedVersions.length !== 2) return null;

    const [version1, version2] = selectedVersions.map(v => 
      survey.versions.find(ver => ver.version === v)
    );

    if (!version1 || !version2) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Сравнение версий {version1.version} и {version2.version}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Версия {version1.version}</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Название:</span> {version1.title}</p>
                <p><span className="font-medium">Описание:</span> {version1.description}</p>
                <p><span className="font-medium">Вопросов:</span> {version1.questions.length}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Версия {version2.version}</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Название:</span> {version2.title}</p>
                <p><span className="font-medium">Описание:</span> {version2.description}</p>
                <p><span className="font-medium">Вопросов:</span> {version2.questions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="h-9 w-9">
            <History className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[80vw] min-w-[800px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>История версий опроса</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setCompareMode(!compareMode)}
            >
              <ArrowRightLeft className="h-4 w-4" />
              {compareMode ? 'Отменить сравнение' : 'Сравнить версии'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleCreateVersion}
            >
              <Plus className="h-4 w-4" />
              Создать версию
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {compareMode && <TableHead className="w-[50px]">Выбор</TableHead>}
                  <TableHead className="w-[100px]">Версия</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[180px]">Дата изменения</TableHead>
                  <TableHead className="w-[100px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {survey.versions.map((version) => (
                  <TableRow key={version.id} className={compareMode && selectedVersions.includes(version.version) ? 'bg-blue-50' : ''}>
                    {compareMode && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(version.version)}
                          onChange={() => handleCompareSelect(version.version)}
                          disabled={!selectedVersions.includes(version.version) && selectedVersions.length >= 2}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>Версия {version.version}</span>
                        {version.version === survey.currentVersion && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Текущая
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{version.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {version.description}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={version.status}
                        onValueChange={(value: SurveyStatus) => handleStatusChange(version.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <Badge variant="outline" className={STATUS_COLORS[version.status]}>
                              {STATUS_LABELS[version.status]}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([status, label]) => (
                            <SelectItem key={status} value={status}>
                              <Badge variant="outline" className={STATUS_COLORS[status as SurveyStatus]}>
                                {label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(version.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="text-right p-0 pr-4">
                      <div className="flex justify-end items-center gap-2 h-[40px]">
                        {!compareMode && (
                          <>
                            <div className="w-[28px]">
                              {version.status === 'draft' ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(version.version)}
                                  title="Редактировать версию"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(version.version)}
                                  title="Просмотреть версию"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="w-[28px]">
                              {version.version !== survey.currentVersion && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRevert(version.version)}
                                  title="Восстановить версию"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {compareMode && renderVersionDiff()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 