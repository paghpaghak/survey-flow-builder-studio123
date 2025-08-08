export const ERROR_CODES = {
  AUTH_REQUIRED: { status: 401, message: 'Требуется аутентификация' },
  AUTH_INVALID_CREDENTIALS: { status: 401, message: 'Неверный email или пароль' },
  PERMISSION_DENIED: { status: 403, message: 'Недостаточно прав' },
  CSRF_INVALID: { status: 403, message: 'CSRF token invalid' },

  VALIDATION_ERROR: { status: 400, message: 'Ошибка валидации' },
  BAD_REQUEST: { status: 400, message: 'Некорректный запрос' },

  NOT_FOUND: { status: 404, message: 'Ресурс не найден' },
  FILE_NOT_FOUND: { status: 404, message: 'Файл не найден' },

  FILE_VALIDATION_ERROR: { status: 400, message: 'Ошибка валидации файла' },

  DB_ERROR: { status: 500, message: 'Ошибка базы данных' },
  UNKNOWN_ERROR: { status: 500, message: 'Внутренняя ошибка сервера' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;


