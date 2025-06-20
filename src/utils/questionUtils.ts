import { Question, QuestionType } from '@/types/survey';
import { QuestionFormData, QuestionOption } from '@/types/question.types';
import { 
  OPTION_BASED_TYPES, 
  DEFAULT_PHONE_SETTINGS, 
  DEFAULT_DATE_SETTINGS,
  ERROR_MESSAGES 
} from '@/constants/question.constants';

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
    case QuestionType.Phone:
      return DEFAULT_PHONE_SETTINGS;
    case QuestionType.Date:
      return DEFAULT_DATE_SETTINGS;
    default:
      return undefined;
  }
};

/**
 * Возвращает человекочитаемую метку для типа вопроса
 */
export const getQuestionTypeLabel = (type: QuestionType): string => {
  const typeMap: Record<QuestionType, string> = {
    [QuestionType.Text]: 'Текст',
    [QuestionType.Radio]: 'Один из списка',
    [QuestionType.Checkbox]: 'Несколько из списка',
    [QuestionType.Select]: 'Выпадающий список',
    [QuestionType.Date]: 'Дата',
    [QuestionType.Email]: 'Email',
    [QuestionType.Phone]: 'Телефон',
    [QuestionType.Number]: 'Число',
    [QuestionType.ParallelGroup]: 'Параллельная ветка',
    [QuestionType.Resolution]: 'Резолюция'
  };
  return typeMap[type] || type;
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
export const isParallelGroupQuestion = (question: Question): boolean => {
  return question.type === QuestionType.ParallelGroup;
};

/**
 * Проверяет, является ли вопрос резолюцией
 */
export const isResolutionQuestion = (question: Question): boolean => {
  return question.type === QuestionType.Resolution;
};

/**
 * Фильтрует вопросы, исключая вложенные в параллельные группы
 */
export const filterVisibleQuestions = (questions: Question[]): Question[] => {
  const allParallelQuestionIds = new Set<string>();
  
  questions.forEach(q => {
    if (isParallelGroupQuestion(q) && q.parallelQuestions) {
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
    if (isParallelGroupQuestion(q) && q.parallelQuestions) {
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