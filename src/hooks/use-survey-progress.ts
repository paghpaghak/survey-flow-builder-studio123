import type { Survey, SurveyVersion } from '@survey-platform/shared-types';
import { useState, useEffect, useMemo } from 'react';

interface SurveyProgress {
  currentPageIndex: number;
  answers: Record<string, any>;
}

export const useSurveyProgress = (survey: Survey, versionId?: number) => {
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
        if (parsedProgress.version === versionId) {
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
  }, [survey.id, versionId]);

  // Сохранение прогресса при изменении
  useEffect(() => {
    const progressToSave = {
      version: versionId,
      ...progress,
    };
    localStorage.setItem(
      `survey_${survey.id}_progress`,
      JSON.stringify(progressToSave)
    );
  }, [progress, survey.id, versionId]);

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
}; 