// ========================================
// SHARED TYPES BARREL EXPORTS
// ========================================

// Основные типы опросов
export * from './types/survey';

// Типы для редактирования вопросов
export * from './types/question.types';

// Константы для вопросов
export * from './constants/question.constants';

// Re-export популярных типов и констант для удобства
export type {
  Survey,
  SurveyVersion,
  Page,
  Question,
  QuestionType,
  SurveyStatus,
  TransitionRule,
} from './types/survey';

export { QUESTION_TYPES } from './types/survey';

export type {
  QuestionOption,
  QuestionFormData,
  QuestionEditDialogProps,
  PhoneQuestionSettings,
  DateQuestionSettings,
} from './types/question.types';

export * from './types/auth';
export * from './types/requests';
export * from './types/survey-response';

export type { QuestionType } from './types/survey';
