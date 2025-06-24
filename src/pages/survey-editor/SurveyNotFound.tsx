import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React from 'react';

interface SurveyNotFoundProps {
  navigate?: ReturnType<typeof useNavigate>;
}

export function SurveyNotFound({ navigate }: SurveyNotFoundProps) {
  const nav = useNavigate();
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <Button variant="ghost" className="gap-1" onClick={() => (navigate ? navigate('/') : nav('/'))}>
          <ArrowLeft className="h-4 w-4" /> Назад к опросам
        </Button>
      </div>
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Опрос не найден</h2>
        <p className="text-gray-500 mb-4">Опрос, который вы ищете, не существует или был удалён.</p>
        <Button onClick={() => (navigate ? navigate('/') : nav('/'))}>Вернуться к списку опросов</Button>
      </div>
    </div>
  );
} 