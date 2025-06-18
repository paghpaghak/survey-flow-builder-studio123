import { Question, QuestionType, ParallelBranchSettings } from '@/types/survey';

// Интерфейсы для вариантов ответов
export interface QuestionOption {
  id: string;
  text: string;
}

// Интерфейсы для правил перехода
export interface TransitionRule {
  id: string;
  answer: string;
  nextQuestionId: string;
}

// Главный интерфейс для данных формы
export interface QuestionFormData {
  title: string;
  description: string;
  type: QuestionType;
  required: boolean;
  options: QuestionOption[];
  transitionRules: TransitionRule[];
  settings?: any;
  parallelQuestions?: string[];
}

// Пропсы для главного диалога
export interface QuestionEditDialogProps {
  question: Question;
  availableQuestions: Question[];
  onClose: () => void;
  onSave?: (updatedQuestion: Question) => void;
  readOnly?: boolean;
}

// Типы для настроек конкретных типов вопросов
export interface PhoneQuestionSettings {
  countryCode: string;
  mask: string;
}

export interface DateQuestionSettings {
  format: string;
}

// Объединенный тип для всех настроек
export type QuestionSettings = PhoneQuestionSettings | DateQuestionSettings | ParallelBranchSettings;

// Интерфейсы для компонентов форм
export interface QuestionBasicFieldsProps {
  data: Pick<QuestionFormData, 'title' | 'description' | 'required'>;
  availableQuestions: Question[];
  currentQuestionId: string;
  onChange: (field: string, value: any) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

export interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
  readOnly?: boolean;
}

export interface QuestionOptionsEditorProps {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

export interface VariableDropdownProps {
  availableQuestions: Question[];
  onInsert: (placeholder: string) => void;
  disabled?: boolean;
}

// Результаты хуков
export interface UseQuestionFormResult {
  formData: QuestionFormData;
  errors: Record<string, string>;
  updateField: (field: keyof QuestionFormData, value: any) => void;
  updateTypeAndSettings: (newType: QuestionType) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

export interface UseParallelBranchResult {
  settings: ParallelBranchSettings;
  questions: string[];
  maxItemsError: string | null;
  updateSettings: (updates: Partial<ParallelBranchSettings>) => void;
  updateMaxItems: (value: number) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
  addQuestion: (questionId: string) => void;
  removeQuestion: (questionId: string) => void;
  clearError: () => void;
}

export interface UseTransitionRulesResult {
  rules: TransitionRule[];
  addRule: () => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, field: keyof TransitionRule, value: string) => void;
  getValidRules: () => TransitionRule[];
  updateRuleAnswer: (ruleId: string, answer: string) => void;
  updateRuleNextQuestion: (ruleId: string, nextQuestionId: string) => void;
  hasRuleForAnswer: (answer: string) => boolean;
  getRuleForAnswer: (answer: string) => TransitionRule | undefined;
  clearAllRules: () => void;
  setAllRules: (newRules: TransitionRule[]) => void;
  getValidRulesCount: () => number;
}