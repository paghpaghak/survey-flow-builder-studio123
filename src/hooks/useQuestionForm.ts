import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { Question, QuestionType } from '@survey-platform/shared-types';
import { useForm, useFieldArray } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { QuestionFormData, UseQuestionFormResult } from '@/types/question.types';
import { 
  getDefaultSettingsForType, 
  needsOptions, 
  validateQuestionForm,
  mapQuestionToFormData 
} from '@/utils/questionUtils';
import { DEFAULT_OPTIONS } from '@survey-platform/shared-types';

/**
 * <summary>
 * Кастомный хук для управления состоянием формы редактирования вопроса.
 * Обеспечивает валидацию, обновление полей и управление настройками типов.
 * </summary>
 * <param name="initialQuestion">Начальный вопрос для инициализации формы</param>
 * <returns>API для управления состоянием формы вопроса</returns>
 */
export function useQuestionForm(initialQuestion: Question): UseQuestionFormResult {
  const [formData, setFormData] = useState<QuestionFormData>(() => 
    mapQuestionToFormData(initialQuestion)
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Обновляет поле формы и очищает соответствующую ошибку
   */
  const updateField = useCallback((field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  /**
   * Обновляет тип вопроса и соответствующие настройки
   */
  const updateTypeAndSettings = useCallback((newType: QuestionType) => {
    setFormData(prev => {
      // Определяем, нужны ли варианты для нового типа
      const shouldHaveOptions = needsOptions(newType);
      
      // Если нужны варианты, но их нет - создаем дефолтные
      const newOptions = shouldHaveOptions 
        ? (prev.options.length > 0 ? prev.options : DEFAULT_OPTIONS.map(opt => ({ ...opt, id: crypto.randomUUID() })))
        : [];

      return {
        ...prev,
        type: newType,
        options: newOptions,
        settings: getDefaultSettingsForType(newType)
      };
    });
  }, []);

  /**
   * Валидирует форму и возвращает результат
   */
  const validateForm = useCallback(() => {
    const newErrors = validateQuestionForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Сбрасывает форму к начальному состоянию
   */
  const resetForm = useCallback(() => {
    setFormData(mapQuestionToFormData(initialQuestion));
    setErrors({});
  }, [initialQuestion]);

  return {
    formData,
    errors,
    updateField,
    updateTypeAndSettings,
    validateForm,
    resetForm
  };
}