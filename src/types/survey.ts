export type SurveyStatus = 'draft' | 'published' | 'archived';

export enum QuestionType {
  Text = 'text',
  Radio = 'radio',
  Checkbox = 'checkbox',
  Select = 'select',
  Date = 'date',
  Email = 'email',
  Phone = 'phone',
  ParallelGroup = 'parallel_group',
  Number = 'number'
}

// Метаданные для разных типов вопросов
export interface DateSettings {
  format?: string;
}

export interface PhoneSettings {
  countryCode?: string;
  mask?: string;
}

export interface NumberSettings {
  min?: number;
  max?: number;
  step?: number;
}

export interface ParallelGroupSettings {
  sourceQuestionId: string;  // ID вопроса-источника (тип Number)
  itemLabel: string;        // Название единицы повторения (например, "Человек")
  minItems?: number;        // Минимальное количество повторений
  maxItems?: number;        // Максимальное количество повторений
  displayMode: 'sequential' | 'tabs';  // Режим отображения повторений
}

// Тип для настроек вопроса в зависимости от его типа
export type QuestionTypeSettings = {
  [QuestionType.Date]: DateSettings;
  [QuestionType.Phone]: PhoneSettings;
  [QuestionType.Text]: Record<string, never>;
  [QuestionType.Radio]: Record<string, never>;
  [QuestionType.Checkbox]: Record<string, never>;
  [QuestionType.Select]: Record<string, never>;
  [QuestionType.Email]: Record<string, never>;
  [QuestionType.Number]: NumberSettings;
  [QuestionType.ParallelGroup]: ParallelGroupSettings;
};

// Тип для правил перехода
export interface TransitionRule {
  id: string;
  answer: string;
  nextQuestionId: string;
}

// Тип для страницы опроса
export interface Page {
  id: string;
  title: string;
  description?: string;
  questions?: string[];
}

// Базовый тип для всех вопросов
export interface Question {
  id: string;
  pageId: string;
  title: string;
  type: QuestionType;
  required?: boolean;
  description?: string;
  options?: { id: string; text: string }[];
  position?: { x: number; y: number };
  settings?: QuestionTypeSettings[QuestionType];
  transitionRules?: TransitionRule[];
  parallelQuestions?: string[];  // ID вопросов, которые нужно повторять в параллельной группе
}

// Тип для ответов на вопросы
export type QuestionAnswer = string | number | Date | string[] | ParallelAnswer;

// Тип для ответов на параллельные вопросы
export interface ParallelAnswer {
  count: number;  // Количество повторений
  answers: Record<string, QuestionAnswer[]>;  // Ответы для каждого повторения
}

export interface SurveyVersion {
  id: string;
  surveyId: string;
  version: number;
  status: SurveyStatus;
  title: string;
  description: string;
  pages: Page[];
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  currentVersion: number;
  publishedVersion?: number;
  versions: SurveyVersion[];
  createdAt: Date;
  updatedAt: Date;
  status: SurveyStatus;
}
