import { useState, useEffect } from 'react';
import { Survey, SurveyVersion } from '@/types/survey';

interface SurveyProgress {
  currentPageIndex: number;
  answers: Record<string, any>;
}

export function useSurveyProgress(survey: Survey, version: SurveyVersion) {
  const [progress, setProgress] = useState<SurveyProgress>({
    currentPageIndex: 0,
    answers: {},
  });

  // Загрузка прогресса при монтировании
  useEffect(() => {
    const savedProgress = localStorage.getItem(`survey_${survey.id}_progress`);
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        // Проверяем, что сохраненный прогресс соответствует текущей версии
        if (parsedProgress.version === version.version) {
          setProgress({
            currentPageIndex: parsedProgress.currentPageIndex,
            answers: parsedProgress.answers,
          });
        } else {
          // Если версия изменилась, очищаем прогресс
          localStorage.removeItem(`survey_${survey.id}_progress`);
        }
      } catch (error) {
        console.error('Ошибка при загрузке прогресса:', error);
        localStorage.removeItem(`survey_${survey.id}_progress`);
      }
    }
  }, [survey.id, version.version]);

  // Сохранение прогресса при изменении
  useEffect(() => {
    const progressToSave = {
      version: version.version,
      ...progress,
    };
    localStorage.setItem(
      `survey_${survey.id}_progress`,
      JSON.stringify(progressToSave)
    );
  }, [progress, survey.id, version.version]);

  const updateProgress = (newProgress: Partial<SurveyProgress>) => {
    setProgress((prev) => ({
      ...prev,
      ...newProgress,
    }));
  };

  const clearProgress = () => {
    localStorage.removeItem(`survey_${survey.id}_progress`);
    setProgress({
      currentPageIndex: 0,
      answers: {},
    });
  };

  return {
    progress,
    updateProgress,
    clearProgress,
  };
} 