'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Survey } from '@/types/survey';
import { SurveyResponse } from '@/types/survey-response';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ResponseListProps {
  survey: Survey;
  responses: SurveyResponse[];
}

export function ResponseList({ survey, responses }: ResponseListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Все ответы</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Время заполнения</TableHead>
              <TableHead>Устройство</TableHead>
              <TableHead>Браузер</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((response) => (
              <TableRow key={response.id}>
                <TableCell>
                  {format(new Date(response.metadata.completedAt), 'PPP', {
                    locale: ru,
                  })}
                </TableCell>
                <TableCell>
                  {Math.round(response.metadata.duration / 1000)} сек.
                </TableCell>
                <TableCell>{response.metadata.device}</TableCell>
                <TableCell>{response.metadata.browser}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 