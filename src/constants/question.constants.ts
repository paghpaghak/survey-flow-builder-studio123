import { QUESTION_TYPES } from '@survey-platform/shared-types';
import type { QuestionType } from '@survey-platform/shared-types';
import { PhoneQuestionSettings, DateQuestionSettings } from '@/types/question.types';

// Опции типов вопросов для селекта
export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: QUESTION_TYPES.Text, label: 'Текст' },
  { value: QUESTION_TYPES.Radio, label: 'Один из списка' },
  { value: QUESTION_TYPES.Checkbox, label: 'Несколько из списка' },
  { value: QUESTION_TYPES.Select, label: 'Выпадающий список' },
  { value: QUESTION_TYPES.Date, label: 'Дата' },
  { value: QUESTION_TYPES.Email, label: 'Email' },
  { value: QUESTION_TYPES.Phone, label: 'Телефон' },
  { value: QUESTION_TYPES.Number, label: 'Число' },
  { value: QUESTION_TYPES.ParallelGroup, label: 'Параллельная ветка' },
];

// Типы вопросов, которые требуют варианты ответов
export const OPTION_BASED_QUESTION_TYPES: QuestionType[] = [
  QUESTION_TYPES.Radio,
  QUESTION_TYPES.Checkbox,
  QUESTION_TYPES.Select,
];

// Варианты ответов по умолчанию
export const DEFAULT_OPTIONS = [
  { id: crypto.randomUUID(), text: 'Вариант 1' },
  { id: crypto.randomUUID(), text: 'Вариант 2' }
] as const;

// Настройки по умолчанию для телефона
export const DEFAULT_PHONE_SETTINGS: PhoneQuestionSettings = {
  countryCode: '+7',
  mask: '(###) ###-##-##'
};

// Опции форматов даты
export const DATE_FORMAT_OPTIONS = [
  { value: 'DD.MM.YYYY', label: 'ДД.ММ.ГГГГ' },
  { value: 'MM/DD/YYYY', label: 'ММ/ДД/ГГГГ' },
  { value: 'YYYY-MM-DD', label: 'ГГГГ-ММ-ДД' }
] as const;

// Настройки по умолчанию для даты
export const DEFAULT_DATE_SETTINGS: DateQuestionSettings = {
  format: 'DD.MM.YYYY'
};

// Режимы отображения параллельных веток
export const PARALLEL_DISPLAY_MODES = [
  { value: 'sequential', label: 'Последовательный' },
  { value: 'tabs', label: 'Вкладки' }
] as const;

// Ограничения для параллельных веток
export const PARALLEL_BRANCH_LIMITS = {
  MIN_ITEMS: 1,
  MAX_ITEMS: 30,
  DEFAULT_MIN: 1,
  DEFAULT_MAX: 5
} as const;

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  TITLE_REQUIRED: 'Заголовок обязателен',
  OPTIONS_EMPTY: 'Все варианты должны быть заполнены',
  MAX_PARALLEL_ITEMS: 'Максимум 30 повторений',
  MIN_PARALLEL_ITEMS: 'Минимум 1 повторение'
} as const;

// Плейсхолдеры для полей
export const PLACEHOLDERS = {
  QUESTION_TITLE: 'Введите заголовок вопроса',
  QUESTION_DESCRIPTION: 'Описание вопроса (опционально)',
  OPTION_TEXT: 'Введите вариант ответа',
  PARALLEL_ITEM_LABEL: 'Например: Ребенок, Питомец, Автомобиль',
  COUNT_LABEL: 'Сколько повторений?',
  COUNT_DESCRIPTION: 'Описание (необязательно)'
} as const;

export { OPTION_BASED_QUESTION_TYPES as OPTION_BASED_TYPES };