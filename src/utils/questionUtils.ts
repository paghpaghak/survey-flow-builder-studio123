import {
  Question,
  QuestionType,
  ParallelAnswer,
  Survey,
  SurveyVersion,
  QUESTION_TYPES,
  QuestionFormData,
  QuestionOption
} from '@survey-platform/shared-types';
import { 
  OPTION_BASED_QUESTION_TYPES as OPTION_BASED_TYPES, 
  DEFAULT_PHONE_SETTINGS, 
  DEFAULT_DATE_SETTINGS,
  ERROR_MESSAGES 
} from '@survey-platform/shared-types';
import type { QuestionType as SurveyQuestionType } from '@survey-platform/shared-types';

/**
 * Проверяет, нужны ли варианты ответов для данного типа вопроса
 */
export const needsOptions = (type: QuestionType): boolean => {
  return OPTION_BASED_TYPES.includes(type as any);
};

/**
 * Возвращает настройки по умолчанию для типа вопроса
 */
export const getDefaultSettingsForType = (type: QuestionType) => {
  switch (type) {
    case QUESTION_TYPES.Phone:
      return DEFAULT_PHONE_SETTINGS;
    case QUESTION_TYPES.Date:
      return DEFAULT_DATE_SETTINGS;
    default:
      return undefined;
  }
};

/**
 * Возвращает человекочитаемую метку для типа вопроса
 */
export const getQuestionTypeName = (type: QuestionType): string => {
  const typeMap: Record<QuestionType, string> = {
    [QUESTION_TYPES.Text]: 'Текст',
    [QUESTION_TYPES.Radio]: 'Один из списка',
    [QUESTION_TYPES.Checkbox]: 'Несколько из списка',
    [QUESTION_TYPES.Select]: 'Выпадающий список',
    [QUESTION_TYPES.Date]: 'Дата',
    [QUESTION_TYPES.Email]: 'Email',
    [QUESTION_TYPES.Phone]: 'Телефон',
    [QUESTION_TYPES.Number]: 'Число',
    [QUESTION_TYPES.ParallelGroup]: 'Параллельная ветка',
    [QUESTION_TYPES.Resolution]: 'Резолюция',
  };
  return typeMap[type] || 'Неизвестный тип';
};

/**
 * Валидирует данные формы вопроса
 */
export const validateQuestionForm = (data: QuestionFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Проверка заголовка
  if (!data.title.trim()) {
    errors.title = ERROR_MESSAGES.TITLE_REQUIRED;
  }
  
  // Проверка вариантов ответов
  if (needsOptions(data.type)) {
    const hasEmptyOptions = data.options.some(opt => !opt.text.trim());
    if (hasEmptyOptions) {
      errors.options = ERROR_MESSAGES.OPTIONS_EMPTY;
    }
  }
  
  return errors;
};

/**
 * Преобразует Question в QuestionFormData
 */
export const mapQuestionToFormData = (question: Question): QuestionFormData => {
  return {
    title: question.title,
    description: question.description || '',
    type: question.type,
    required: question.required ?? false,
    options: question.options || [],
    transitionRules: question.transitionRules || [],
    settings: question.settings,
    parallelQuestions: question.parallelQuestions || []
  };
};

/**
 * Преобразует QuestionFormData в Question
 */
export const mapFormDataToQuestion = (formData: QuestionFormData, originalQuestion: Question): Question => {
  return {
    ...originalQuestion,
    title: formData.title,
    description: formData.description,
    type: formData.type,
    required: formData.required,
    options: needsOptions(formData.type) ? formData.options : undefined,
    transitionRules: formData.transitionRules.length > 0 ? formData.transitionRules : undefined,
    settings: formData.settings,
    parallelQuestions: formData.parallelQuestions
  };
};

/**
 * Генерирует уникальный ID для варианта ответа
 */
export const generateOptionId = (): string => {
  return crypto.randomUUID();
};

/**
 * Генерирует уникальный ID для правила перехода
 */
export const generateRuleId = (): string => {
  return crypto.randomUUID();
};

/**
 * Создает новый вариант ответа
 */
export const createNewOption = (text: string = 'Новый вариант'): QuestionOption => {
  return {
    id: generateOptionId(),
    text
  };
};

/**
 * Проверяет, является ли вопрос параллельной группой
 */
export function isParallelGroup(question: Question): boolean {
  return question.type === QUESTION_TYPES.ParallelGroup;
}

/**
 * Проверяет, является ли вопрос резолюцией
 */
export function isResolution(question: Question): boolean {
  return question.type === QUESTION_TYPES.Resolution;
}

/**
 * Фильтрует вопросы, исключая вложенные в параллельные группы
 */
export const filterVisibleQuestions = (questions: Question[]): Question[] => {
  const allParallelQuestionIds = new Set<string>();
  
  questions.forEach(q => {
    if (isParallelGroup(q) && q.parallelQuestions) {
      q.parallelQuestions.forEach(subId => allParallelQuestionIds.add(subId));
    }
  });

  return questions.filter(q => !allParallelQuestionIds.has(q.id));
};

/**
 * Получает все ID вопросов, вложенных в параллельные группы
 */
export const getParallelQuestionIds = (questions: Question[]): Set<string> => {
  const parallelIds = new Set<string>();
  
  questions.forEach(q => {
    if (isParallelGroup(q) && q.parallelQuestions) {
      q.parallelQuestions.forEach(subId => parallelIds.add(subId));
    }
  });

  return parallelIds;
};

/**
 * Создает плейсхолдер переменной для описания
 */
export const createVariablePlaceholder = (questionId: string): string => {
  return `{{${questionId}}}`;
};

/**
 * Вставляет переменную в текст в указанную позицию
 */
export const insertVariableAtPosition = (
  text: string, 
  variable: string, 
  start: number, 
  end: number = start
): string => {
  const before = text.slice(0, start);
  const after = text.slice(end);
  return before + variable + after;
};