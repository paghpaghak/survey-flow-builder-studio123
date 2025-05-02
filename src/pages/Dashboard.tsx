import { SurveyList } from '@/components/surveys/SurveyList';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Конструктор опросов</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Панель администратора
        </Button>
      </div>
      <SurveyList />
    </div>
  );
}
