import React from 'react';
import { Survey } from '@survey-platform/shared-types';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SurveyTableRow } from '../SurveyTableRow';

interface SurveyTableProps {
  surveys: Survey[];
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

export function SurveyTable({
  surveys,
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
}: SurveyTableProps) {
  return (
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
          {surveys.map((survey, idx) => (
            <SurveyTableRow
              key={survey.id || `survey-idx-${idx}`}
              survey={survey}
              index={idx}
              isAdmin={isAdmin}
              showDeleteDialog={showDeleteDialog}
              getStatusColor={getStatusColor}
              handleDuplicateSurvey={handleDuplicateSurvey}
              setShowDeleteDialog={setShowDeleteDialog}
              deleteSurvey={deleteSurvey}
              reloadSurveys={reloadSurveys}
              setEditingSurvey={setEditingSurvey}
              canEditSurvey={canEditSurvey}
              canDeleteSurvey={canDeleteSurvey}
              canViewResponses={canViewResponses}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 