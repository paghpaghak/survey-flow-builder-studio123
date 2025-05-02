import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Survey } from '@/types/survey';
import { fetchSurveys } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Edit, BarChart2, ArrowLeft, UserSquare2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSurveys() {
      try {
        const fetchedSurveys = await fetchSurveys();
        setSurveys(fetchedSurveys);
      } catch (error) {
        console.error('Ошибка при загрузке опросов:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSurveys();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Панель администратора</h1>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey.id}>
                <TableCell className="font-medium">{survey.title}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    survey.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {survey.status === 'published' ? 'Опубликован' : 'Черновик'}
                  </span>
                </TableCell>
                <TableCell>{new Date(survey.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/take/${survey.id}`)}
                          >
                            <UserSquare2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Пройти опрос</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/surveys/${survey.id}/results`)}
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Результаты
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 