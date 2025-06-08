import { useState } from 'react';
import { Survey, SurveyVersion } from '@/types/survey';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SurveyVersionsProps {
  survey: Survey;
  onPublish: (version: number) => void;
  onLoadVersion: (version: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SurveyVersions({ survey, onPublish, onLoadVersion, isOpen, onClose }: SurveyVersionsProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const handlePublish = () => {
    if (selectedVersion === null) return;
    onPublish(selectedVersion);
    onClose();
  };

  const handleLoadVersion = () => {
    if (selectedVersion === null) return;
    onLoadVersion(selectedVersion);
    onClose();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Опубликован</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500">В архиве</Badge>;
      default:
        return <Badge variant="outline">Черновик</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: ru });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Версии опросника</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Текущая версия: {survey.currentVersion}
            {survey.publishedVersion && ` | Опубликованная версия: ${survey.publishedVersion}`}
          </div>

          <div className="border rounded-lg divide-y">
            {survey.versions.map((version) => (
              <div
                key={version.id}
                className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                  selectedVersion === version.version ? 'bg-gray-50' : ''
                }`}
                onClick={() => setSelectedVersion(version.version)}
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    Версия {version.version} {getStatusBadge(version.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Обновлено: {formatDate(new Date(version.updatedAt))}
                    {version.publishedAt && ` | Опубликовано: ${formatDate(new Date(version.publishedAt))}`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadVersion}
              disabled={selectedVersion === null}
            >
              Загрузить версию
            </Button>
            <Button
              onClick={handlePublish}
              disabled={selectedVersion === null}
            >
              Опубликовать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 