import type { ParallelBranchSettings } from '@survey-platform/shared-types';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { Question } from '@survey-platform/shared-types';
import { useState, useCallback } from 'react';
import { UseParallelBranchResult } from '@/types/question.types';
import { PARALLEL_BRANCH_LIMITS, ERROR_MESSAGES } from '@survey-platform/shared-types';

/**
 * <summary>
 * Кастомный хук для управления настройками параллельной ветки вопросов.
 * Включает валидацию максимального количества элементов и управление порядком вопросов.
 * </summary>
 * <param name="initialSettings">Начальные настройки параллельной ветки</param>
 * <param name="initialQuestions">Начальный список ID вопросов</param>
 * <returns>API для управления параллельной веткой</returns>
 */
export function useParallelBranch(
  initialSettings: Partial<ParallelBranchSettings> = {}, 
  initialQuestions: string[] = []
): UseParallelBranchResult {
  
  // Инициализация настроек с дефолтными значениями
  const [settings, setSettings] = useState<ParallelBranchSettings>(() => ({
    sourceQuestionId: initialSettings.sourceQuestionId || '',
    itemLabel: initialSettings.itemLabel || '',
    displayMode: initialSettings.displayMode || 'tabs',
    minItems: initialSettings.minItems || PARALLEL_BRANCH_LIMITS.DEFAULT_MIN,
    maxItems: Math.min(initialSettings.maxItems || PARALLEL_BRANCH_LIMITS.DEFAULT_MAX, PARALLEL_BRANCH_LIMITS.MAX_ITEMS),
    countLabel: initialSettings.countLabel,
    countDescription: initialSettings.countDescription,
    countRequired: initialSettings.countRequired || false
  }));
  
  const [questions, setQuestions] = useState<string[]>(initialQuestions);
  const [maxItemsError, setMaxItemsError] = useState<string | null>(null);

  /**
   * Обновляет настройки параллельной ветки
   */
  const updateSettings = useCallback((updates: Partial<ParallelBranchSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Обновляет максимальное количество элементов с валидацией
   */
  const updateMaxItems = useCallback((value: number) => {
    const minValue = Math.max(value, settings.minItems);
    const clampedValue = Math.min(minValue, PARALLEL_BRANCH_LIMITS.MAX_ITEMS);
    
    // Проверяем превышение лимита
    if (value > PARALLEL_BRANCH_LIMITS.MAX_ITEMS) {
      setMaxItemsError(ERROR_MESSAGES.MAX_PARALLEL_ITEMS);
    } else {
      setMaxItemsError(null);
    }
    
    updateSettings({ maxItems: clampedValue });
  }, [settings.minItems, updateSettings]);

  /**
   * Меняет порядок вопросов в списке (для drag & drop)
   */
  const reorderQuestions = useCallback((startIndex: number, endIndex: number) => {
    setQuestions(prev => {
      if (startIndex < 0 || endIndex < 0 || startIndex >= prev.length || endIndex >= prev.length) {
        return prev; // Защита от некорректных индексов
      }
      
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  /**
   * Добавляет вопрос в параллельную ветку
   */
  const addQuestion = useCallback((questionId: string) => {
    setQuestions(prev => {
      // Проверяем, что вопрос еще не добавлен
      if (prev.includes(questionId)) {
        return prev;
      }
      return [...prev, questionId];
    });
  }, []);

  /**
   * Удаляет вопрос из параллельной ветки
   */
  const removeQuestion = useCallback((questionId: string) => {
    setQuestions(prev => prev.filter(id => id !== questionId));
  }, []);

  /**
   * Очищает ошибку максимального количества элементов
   */
  const clearError = useCallback(() => {
    setMaxItemsError(null);
  }, []);

  return {
    settings,
    questions,
    maxItemsError,
    updateSettings,
    updateMaxItems,
    reorderQuestions,
    addQuestion,
    removeQuestion,
    clearError
  };
}