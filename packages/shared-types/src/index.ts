// ========================================
// SHARED TYPES BARREL EXPORTS
// ========================================

// Constants
export { QUESTION_TYPES } from './types/survey';
export * from './constants/question.constants';

// Auth
export type {
  User,
  UserRole,
  UserWithPassword,
  LoginCredentials,
  AuthResponse,
  AuthState,
} from './types/auth';

// Requests
export type { UpdateSurveyRequest } from './types/requests';

// Survey Response
export type {
  SurveyAnswer,
  SurveyResponse,
  CreateSurveyResponseDto,
} from './types/survey-response';

// Survey and Question Structure
export type {
  Survey,
  SurveyVersion,
  Page,
  Question,
  QuestionType,
  SurveyStatus,
  TransitionRule,
  DateSettings,
  PhoneSettings,
  TextSettings,
  SelectSettings,
  NumberSettings,
  ParallelBranchSettings,
  FileUploadSettings,
  QuestionTypeSettings,
  QuestionAnswer,
  ParallelAnswer,
  FileUploadAnswer,
  UploadedFile,
  SurveyPage,
  PageTransitionCondition,
  PageTransitionRule,
  ResolutionRule,
} from './types/survey';

// Question Form and Dialog
export type {
  QuestionOption,
  QuestionFormData,
  QuestionEditDialogProps,
  PhoneQuestionSettings,
  DateQuestionSettings,
  QuestionSettings,
  QuestionBasicFieldsProps,
  QuestionTypeSelectorProps,
  QuestionOptionsEditorProps,
  VariableDropdownProps,
} from './types/question.types';
