// Внутренние импорты в пакете не должны содержать расширений .ts
// Они разрешаются автоматически TypeScript
import { QuestionType, QUESTION_TYPES, FileUploadSettings, TextSettings, SelectSettings } from '../types/survey';
import { PhoneQuestionSettings, DateQuestionSettings } from '../types/question.types';

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
  { value: QUESTION_TYPES.FileUpload, label: 'Загрузка документов' },
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

// Готовые маски ввода для текстовых полей
export const INPUT_MASK_OPTIONS = [
  { value: '', label: 'Без маски' },
  { value: '+7 (000) 000-00-00', label: 'Телефон России' },
  { value: '00.00.0000', label: 'Дата (ДД.ММ.ГГГГ)' },
  { value: '0000-00-00', label: 'Дата (ГГГГ-ММ-ДД)' },
  { value: '000-000-000 00', label: 'ИНН (10 цифр)' },
  { value: '000 000 000', label: 'СНИЛС' },
  { value: '0000 0000 0000 0000', label: 'Банковская карта' },
  { value: '00:00:0000000:000', label: 'Кадастровый номер' },
  { value: 'AAA-000', label: 'Код (буквы-цифры)' },
  { value: '000000', label: 'Почтовый индекс' },
  { value: 'custom', label: '💡 Настроить свою маску' }
] as const;

// Настройки по умолчанию для текста
export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  inputMask: undefined,
  placeholder: 'Введите ответ',
  maxLength: undefined,
  showTitleInside: false
};

// Настройки по умолчанию для выпадающего списка
export const DEFAULT_SELECT_SETTINGS: SelectSettings = {
  defaultOptionId: undefined,
  placeholder: 'Выберите вариант'
};

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

// Опции типов файлов
export const FILE_TYPE_OPTIONS = [
  { value: '*', label: 'Любые файлы' },
  { value: 'image/*', label: 'Изображения (JPG, PNG, GIF)' },
  { value: 'application/pdf', label: 'PDF документы' },
  { value: '.doc,.docx', label: 'Word документы' },
  { value: '.xls,.xlsx', label: 'Excel таблицы' },
  { value: '.txt', label: 'Текстовые файлы' },
] as const;

// Опции размеров файлов
export const FILE_SIZE_OPTIONS = [
  { value: 1024 * 1024, label: '1 МБ' },
  { value: 5 * 1024 * 1024, label: '5 МБ' },
  { value: 10 * 1024 * 1024, label: '10 МБ' },
  { value: 50 * 1024 * 1024, label: '50 МБ' },
  { value: 100 * 1024 * 1024, label: '100 МБ' }
] as const;

// Настройки по умолчанию для загрузки файлов
export const DEFAULT_FILE_UPLOAD_SETTINGS: FileUploadSettings = {
  allowedTypes: ['*'],
  maxFileSize: 10 * 1024 * 1024, // 10 МБ
  maxFiles: 5,
  buttonText: 'Выберите файлы',
  helpText: 'Поддерживаются файлы до 10 МБ'
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
