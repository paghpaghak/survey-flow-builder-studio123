import type { Question, TransitionRule, QuestionFormData } from '@survey-platform/shared-types';

/**
 * Результат хука useQuestionForm
 */
export interface UseQuestionFormResult {
  formData: QuestionFormData;
  errors: Record<string, string>;
  updateField: (field: keyof QuestionFormData, value: any) => void;
  updateTypeAndSettings: (type: string, settings?: any) => void;
  validateForm: () => boolean;
}

/**
 * Результат хука useTransitionRules  
 */
export interface UseTransitionRulesResult {
  rules: TransitionRule[];
  addRule: () => void;
  updateRule: (index: number, updates: Partial<TransitionRule>) => void;
  removeRule: (index: number) => void;
  getValidRules: () => TransitionRule[];
}

/**
 * Настройки параллельной ветки для хука
 */
export interface ParallelBranchSettings {
  sourceQuestionId: string;
  itemLabel: string;
  displayMode: 'sequential' | 'tabs';
  minItems: number;
  maxItems: number;
  countLabel?: string;
  countDescription?: string;
  countRequired?: boolean;
}

/**
 * Результат хука useParallelBranch
 */
export interface UseParallelBranchResult {
  settings: ParallelBranchSettings;
  questions: string[];
  maxItemsError: string | null;
  updateSettings: (updates: Partial<ParallelBranchSettings>) => void;
  updateMaxItems: (value: number) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
  addQuestion: (questionId: string) => void;
  removeQuestion: (questionId: string) => void;
} 