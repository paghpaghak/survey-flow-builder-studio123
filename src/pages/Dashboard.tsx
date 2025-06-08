import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Survey } from '@/types/survey';
import { fetchSurveys } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SurveyList } from '@/components/surveys/SurveyList';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSurveys = useCallback(async () => {
    try {
      const fetchedSurveys = await fetchSurveys();
      setSurveys(fetchedSurveys);
    } catch (error) {
      console.error('Ошибка при загрузке опросов:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <SurveyList surveys={surveys} reloadSurveys={loadSurveys} />
      </div>
    </>
  );
}
