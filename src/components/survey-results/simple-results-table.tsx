'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Survey, SurveyResponse, Question } from '@/types/survey';
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

interface SimpleResultsTableProps {
  survey: Survey;
  responses: SurveyResponse[];
  questions: Question[];
}

export function SimpleResultsTable({
  survey,
  responses,
  questions,
}: SimpleResultsTableProps) {
  // Создаем массив заголовков таблицы
  const headers = [
    'Дата',
    'Время заполнения',
    ...questions.map((q) => q.title),
  ];

  // Форматируем ответы для отображения
  const formatAnswer = (answer: any) => {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer?.toString() || '-';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Результаты опроса</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id}>
                  <TableCell>
                    {(() => {
                      const dateStr =
                        response?.metadata?.completedAt ||
                        response?.createdAt ||
                        response?.created_at ||
                        (response?._id?.getTimestamp ? response._id.getTimestamp() : null);
                      if (!dateStr) return '-';
                      try {
                        return format(new Date(dateStr), 'PPP', { locale: ru });
                      } catch {
                        return '-';
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    {response.metadata?.duration
                      ? Math.round(response.metadata.duration / 1000) + ' сек.'
                      : '-'}
                  </TableCell>
                  {questions.map((question) => {
                    const answer = response.answers.find(
                      (a) => a.questionId === question.id
                    );
                    return (
                      <TableCell key={question.id}>
                        {formatAnswer(answer?.value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 