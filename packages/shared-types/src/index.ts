// ========================================
// SHARED TYPES BARREL EXPORTS
// ========================================

// Основные типы опросов
export * from './types/survey';

// Типы для редактирования вопросов
export * from './types/question.types';

// Константы для вопросов
export * from './constants/question.constants';

// Re-export популярных типов для удобства
export type {
  Survey,
  SurveyVersion,
  Page,
  Question,
  SurveyStatus,
  TransitionRule
} from './types/survey';

export type {
  QuestionOption,
  QuestionFormData,
  QuestionEditDialogProps,
  PhoneQuestionSettings,
  DateQuestionSettings
} from './types/question.types';
