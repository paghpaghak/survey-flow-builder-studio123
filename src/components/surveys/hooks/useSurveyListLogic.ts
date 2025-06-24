import { useState, useEffect, useMemo } from 'react';
import { Survey } from '@survey-platform/shared-types';
import { useSurveyStore } from '@/store/survey-store';
import { useSurveyFilters } from '@/hooks/useSurveyFilters';
import { useAuth } from '@/hooks/useAuth';
import { createSurvey } from '@/lib/api';
import { duplicateSurvey } from '@/utils/surveyUtils';

interface UseSurveyListLogicProps {
  surveys: Survey[];
  reloadSurveys?: () => void;
  onSurveyCreated?: () => void;
}

export function useSurveyListLogic({
  surveys,
  reloadSurveys,
  onSurveyCreated,
}: UseSurveyListLogicProps) {
  const { deleteSurvey, loadSurveys } = useSurveyStore();
  const { user } = useAuth();
  
  // Состояние диалогов
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [localSurveys, setLocalSurveys] = useState<Survey[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);

  // Вычисляемые значения
  const isAdmin = user?.role === 'admin';
  const allSurveys = useMemo(() => 
    localSurveys.length > 0 ? [...localSurveys, ...surveys] : surveys,
    [localSurveys, surveys]
  );

  // Фильтрация и сортировка
  const surveyFilters = useSurveyFilters(allSurveys);

  // Функция для определения цвета статуса
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'draft': return 'bg-yellow-500';
      case 'published': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  // Загрузка опросов при инициализации
  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  // Обработчики событий
  const handleSurveyCreated = async () => {
    if (onSurveyCreated) onSurveyCreated();
    if (reloadSurveys) await reloadSurveys();
  };

  const handleSurveyEdited = async () => {
    if (reloadSurveys) await reloadSurveys();
    setEditingSurvey(null);
  };

  const handleDuplicateSurvey = async (survey: Survey) => {
    const newSurveyData = duplicateSurvey(survey);
    const created = await createSurvey(newSurveyData as Survey);
    if (reloadSurveys) {
      await reloadSurveys();
    } else {
      setLocalSurveys(prev => [created, ...prev]);
    }
  };

  return {
    // Состояние
    isAdmin,
    showDeleteDialog,
    setShowDeleteDialog,
    editingSurvey,
    setEditingSurvey,
    showVersionHistory,
    setShowVersionHistory,
    
    // Данные
    sortedSurveys: surveyFilters.filteredAndSortedSurveys,
    
    // Фильтрация и поиск
    ...surveyFilters,
    
    // Обработчики
    handleSurveyCreated,
    handleSurveyEdited,
    handleDuplicateSurvey,
    getStatusColor,
    deleteSurvey,
    reloadSurveys,
  };
} 