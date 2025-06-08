'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question } from '@/types/survey';
import { SurveyResponse } from '@/types/survey-response';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnswerStatsProps {
  question: Question;
  responses: SurveyResponse[];
}

export function AnswerStats({ question, responses }: AnswerStatsProps) {
  const getAnswerStats = () => {
    const stats: Record<string, number> = {};

    responses.forEach((response) => {
      const answer = response.answers.find((a) => a.questionId === question.id);
      if (!answer) return;

      if (Array.isArray(answer.value)) {
        answer.value.forEach((value: string) => {
          stats[value] = (stats[value] || 0) + 1;
        });
      } else {
        stats[answer.value] = (stats[answer.value] || 0) + 1;
      }
    });

    return Object.entries(stats).map(([value, count]) => ({
      value,
      count,
      percentage: (count / responses.length) * 100,
    }));
  };

  const stats = getAnswerStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="value" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value} ответов`, 'Количество']}
              />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {stats.map((stat) => (
            <div key={stat.value} className="flex items-center justify-between">
              <span>{stat.value}</span>
              <div className="flex items-center space-x-2">
                <span>{stat.count}</span>
                <span className="text-muted-foreground">
                  ({stat.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 