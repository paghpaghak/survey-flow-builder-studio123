import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Survey } from '@/types/survey';
import { SurveyResponse } from '@/types/survey-response';
import { fetchSurveyById } from '@/lib/api';
import { getSurveyResponses } from '@/lib/api/survey-results';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function SurveyResults() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!surveyId) {
          setError('ID опроса не указан');
          return;
        }

        console.log('Loading data for survey:', surveyId);
        
        const [surveyData, responsesData] = await Promise.all([
          fetchSurveyById(surveyId),
          getSurveyResponses(surveyId)
        ]);

        console.log('Loaded survey:', surveyData);
        console.log('Loaded responses:', responsesData);
        console.log('Response structure check:', {
          firstResponse: responsesData[0],
          totalResponses: responsesData.length,
          hasAnswers: responsesData[0]?.answers?.length > 0
        });

        setSurvey(surveyData);
        setResponses(responsesData || []);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [surveyId]);

  if (loading) {
    return <div className="container py-8">Загрузка...</div>;
  }

  if (error || !survey) {
    return (
      <div className="container py-8">
        <div className="text-red-500">{error || 'Опрос не найден'}</div>
      </div>
    );
  }

  // Получаем вопросы из опубликованной версии
  const publishedVersion = survey.versions?.find(v => v.status === 'published');
  const questions = publishedVersion?.questions || [];

  // Форматируем ответ для отображения
  const formatAnswer = (answer: any) => {
    if (!answer) return '-';
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer);
  };

  // Считаем статистику по ответам
  const getAnswerStats = (questionId: string) => {
    const answers = responses
      .map(r => r.answers.find(a => a.questionId === questionId)?.value)
      .filter(Boolean);

    if (answers.length === 0) return null;

    const total = answers.length;
    const stats: Record<string, number> = {};

    answers.forEach(answer => {
      const key = formatAnswer(answer);
      stats[key] = (stats[key] || 0) + 1;
    });

    return Object.entries(stats).map(([answer, count]) => ({
      answer,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/')}>Назад</Button>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Всего ответов: {responses.length}
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Сводка</TabsTrigger>
          <TabsTrigger value="details">Детальные ответы</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-6">
            {questions.map(question => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{question.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getAnswerStats(question.id)?.map(({ answer, count, percentage }) => (
                      <div key={answer} className="flex items-center gap-2">
                        <div className="flex-1">{answer}</div>
                        <div className="text-muted-foreground">
                          {count} ({percentage}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      {questions.map(q => (
                        <TableHead key={q.id}>{q.title}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map(response => (
                      <TableRow key={response.id}>
                        <TableCell>
                          {format(
                            new Date(
                              response.metadata?.completedAt || response.createdAt || Date.now()
                            ),
                            'PPP',
                            { locale: ru }
                          )}
                        </TableCell>
                        {questions.map(question => {
                          const answer = response.answers.find(
                            a => a.questionId === question.id
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
        </TabsContent>
      </Tabs>
    </div>
  );
} 