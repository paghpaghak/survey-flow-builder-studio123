// Импортируем из локального файла survey.ts (не через алиас @/)
import { Question, QuestionType, ParallelBranchSettings, TransitionRule } from './survey';

// Интерфейсы для вариантов ответов
export interface QuestionOption {
  id: string;
  text: string;
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
