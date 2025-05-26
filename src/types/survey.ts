/**
 * <summary>
 * Типы и интерфейсы для описания структуры опроса, страниц и вопросов.
 * </summary>
 */

export type SurveyStatus = 'draft' | 'published' | 'archived';

/**
 * <summary>
 * Перечисление всех поддерживаемых типов вопросов.
 * </summary>
 */
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
  countLabel?: string; // Заголовок поля 'Сколько повторений?'
  countDescription?: string; // Описание поля
  countRequired?: boolean; // Обязательность
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
}

// Тип для ответов на вопросы
export type QuestionAnswer = string | number | Date | string[] | ParallelAnswer;

// Тип для ответов на параллельные вопросы
export interface ParallelAnswer {
  count: number;  // Количество повторений
  answers: Record<string, QuestionAnswer[]>;  // Ответы для каждого повторения
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
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
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
  publishedVersion: number;
  versions: {
    id: string;
    version: number;
    status: SurveyStatus;
    title: string;
    description: string;
    pages: Page[];
    questions: Question[];
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  }[];
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
  questions: SurveyQuestion[];
  transitionRules?: PageTransitionRule[];
  // ... другие поля ...
}
