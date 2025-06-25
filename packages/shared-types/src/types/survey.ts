/**
 * <summary>
 * Типы и интерфейсы для описания структуры опроса, страниц и вопросов.
 * </summary>
 */

export type SurveyStatus = 'draft' | 'published' | 'archived';

/**
 * <summary>
 * Перечисление всех поддерживаемых типов вопросов.
 * Используем объект с as const вместо enum для лучшей совместимости с JS.
 * </summary>
 */
export const QUESTION_TYPES = {
  Text: 'text',
  Number: 'number',
  Radio: 'radio',
  Checkbox: 'checkbox',
  Select: 'select',
  Date: 'date',
  FileUpload: 'file_upload',
  ParallelGroup: 'parallel_group',
  Resolution: 'resolution',
} as const;

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];

// Метаданные для разных типов вопросов
export interface DateSettings {
  format?: string;
}



export interface TextSettings {
  inputMask?: string;        // Маска ввода (например, "+7 (999) 999-99-99")
  showTitleInside?: boolean; // Показывать заголовок вопроса внутри поля ввода
}

export interface SelectSettings {
  defaultOptionId?: string;  // ID варианта ответа, выбранного по умолчанию
}

export interface NumberSettings {
  min?: number;
  max?: number;
  step?: number;
}

export interface ParallelBranchSettings {
  sourceQuestionId: string;  // ID вопроса-источника (тип Number)
  itemLabel: string;        // Название единицы повторения (например, "Человек")
  minItems?: number;        // Минимальное количество повторений
  maxItems?: number;        // Максимальное количество повторений
  displayMode: 'sequential' | 'tabs';  // Режим отображения повторений
  countLabel?: string; // Заголовок поля 'Сколько повторений?'
  countDescription?: string; // Описание поля
  countRequired?: boolean; // Обязательность
}

export interface FileUploadSettings {
  allowedTypes: string[];           // ['image/*', 'application/pdf']
  maxFileSize: number;              // в байтах
  maxFiles: number;                 // максимальное количество файлов
  buttonText?: string;              // текст кнопки
  helpText?: string;                // подсказка
}

// Тип для настроек вопроса в зависимости от его типа
export type QuestionTypeSettings = {
  [QUESTION_TYPES.Date]: DateSettings;
  [QUESTION_TYPES.Text]: TextSettings;
  [QUESTION_TYPES.Radio]: Record<string, never>;
  [QUESTION_TYPES.Checkbox]: Record<string, never>;
  [QUESTION_TYPES.Select]: SelectSettings;
  [QUESTION_TYPES.Number]: NumberSettings;
  [QUESTION_TYPES.FileUpload]: FileUploadSettings;
  [QUESTION_TYPES.ParallelGroup]: ParallelBranchSettings;
  [QUESTION_TYPES.Resolution]: Record<string, never>;
};

// Тип для правил перехода
export interface TransitionRule {
  id: string;
  answer: string;
  nextQuestionId: string;
  condition?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value?: string | number;
}

/**
 * <summary>
 * Интерфейс страницы опроса.
 * </summary>
 * <property name="id">Уникальный идентификатор страницы</property>
 * <property name="title">Название страницы</property>
 * <property name="description">Описание страницы</property>
 * <property name="questions">Вопросы, относящиеся к странице</property>
 */
export interface Page {
  id: string;
  title: string;
  description?: string;
  questions: Question[];  // Массив вопросов вместо массива ID
  descriptionPosition?: 'before' | 'after';
  visibilityRules?: PageVisibilityRule[]; // Правила условной видимости страницы
}

/**
 * <summary>
 * Интерфейс вопроса опроса.
 * </summary>
 * <property name="id">Уникальный идентификатор вопроса</property>
 * <property name="pageId">ID страницы, к которой относится вопрос</property>
 * <property name="title">Текст вопроса</property>
 * <property name="type">Тип вопроса</property>
 * <property name="required">Обязательный ли вопрос</property>
 * <property name="description">Описание вопроса</property>
 * <property name="options">Варианты ответа (для select/radio/checkbox)</property>
 * <property name="position">Позиция на странице (x, y)</property>
 * <property name="settings">Дополнительные настройки</property>
 * <property name="transitionRules">Правила перехода</property>
 * <property name="parallelQuestions">ID параллельных вопросов</property>
 */
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
  resolutionRules?: ResolutionRule[];
  defaultResolution?: string;
  visibilityRules?: QuestionVisibilityRule[]; // Правила условной видимости
}

// Тип для ответов на вопросы
export type QuestionAnswer = string | number | Date | string[] | ParallelAnswer | FileUploadAnswer;

// Тип для ответов на параллельные вопросы
export interface ParallelAnswer {
  count: number;  // Количество повторений
  answers: Record<string, QuestionAnswer[]>;  // Ответы для каждого повторения
}

// Тип для ответов на загрузку файлов
export interface FileUploadAnswer {
  files: UploadedFile[];
}

export interface UploadedFile {
  id: string;                 // уникальный ID файла
  name: string;               // оригинальное имя
  size: number;               // размер в байтах
  type: string;               // MIME type
  uploadedAt: string;         // дата загрузки файла
  serverFileId?: string;      // ID файла на сервере (GridFS)
}

/**
 * <summary>
 * Интерфейс версии опроса.
 * </summary>
 * <property name="id">Уникальный идентификатор версии</property>
 * <property name="surveyId">ID опроса</property>
 * <property name="version">Номер версии</property>
 * <property name="status">Статус версии</property>
 * <property name="title">Название опроса</property>
 * <property name="description">Описание опроса</property>
 * <property name="questions">Вопросы в этой версии</property>
 * <property name="pages">Страницы в этой версии</property>
 * <property name="createdAt">Дата создания</property>
 * <property name="updatedAt">Дата обновления</property>
 */
export interface SurveyVersion {
  id: string;
  surveyId: string;
  version: number;
  status: SurveyStatus;
  title: string;
  description: string;
  pages: Page[];
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

/**
 * <summary>
 * Интерфейс опроса.
 * </summary>
 * <property name="id">Уникальный идентификатор опроса</property>
 * <property name="title">Название опроса</property>
 * <property name="description">Описание опроса</property>
 * <property name="status">Статус опроса</property>
 * <property name="versions">Версии опроса</property>
 * <property name="currentVersion">Текущая версия</property>
 * <property name="publishedVersion">Опубликованная версия</property>
 * <property name="createdAt">Дата создания</property>
 * <property name="updatedAt">Дата обновления</property>
 */
export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  currentVersion: number;
  publishedVersion?: number;
  versions: SurveyVersion[];
  responsesCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Тип условия перехода между страницами
export type PageTransitionCondition =
  | { type: 'answer_equals'; questionId: string; value: string | number | boolean }
  | { type: 'answered'; questionId: string }
  | { type: 'answer_includes'; questionId: string; value: string }
  | { type: 'score_greater_than'; score: number }
  | { type: 'any_answer_equals'; value: string }
  | { type: 'default' };

// Тип правила перехода между страницами
export type PageTransitionRule = {
  condition: PageTransitionCondition;
  nextPageId: string | null; // null — завершить опрос
};

// Добавляю поле transitionRules в SurveyPage
export interface SurveyPage {
  id: string;
  title: string;
  questions: Question[];
  transitionRules?: PageTransitionRule[];
  // ... другие поля ...
}

// Тип для одного правила резолюции
export interface ResolutionRule {
  id: string;
  conditions: Array<{ questionId: string; operator: string; value: any }>;
  logic: 'AND' | 'OR';
  resultText: string;
}

// ===== УСЛОВНАЯ ЛОГИКА ВИДИМОСТИ =====

// Базовые условия для проверки видимости
export type VisibilityCondition =
  | { type: 'answer_equals'; questionId: string; value: string | number | boolean }
  | { type: 'answer_not_equals'; questionId: string; value: string | number | boolean }
  | { type: 'answer_contains'; questionId: string; value: string }
  | { type: 'answer_greater_than'; questionId: string; value: number }
  | { type: 'answer_less_than'; questionId: string; value: number }
  | { type: 'answered'; questionId: string }
  | { type: 'not_answered'; questionId: string }
  | { type: 'answer_includes'; questionId: string; value: string }; // для множественного выбора

// Группа условий с логическим оператором
export interface VisibilityGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: VisibilityCondition[];
}

// Правило видимости для вопроса
export interface QuestionVisibilityRule {
  id: string;
  action: 'show' | 'hide';
  groups: VisibilityGroup[];
  groupsLogic: 'AND' | 'OR'; // Логика между группами
}

// Правило видимости для страницы
export interface PageVisibilityRule {
  id: string;
  action: 'show' | 'hide'; 
  groups: VisibilityGroup[];
  groupsLogic: 'AND' | 'OR';
}
