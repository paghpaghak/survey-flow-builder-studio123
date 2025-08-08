/**
 * Рекурсивно преобразует строки дат в объекты Date
 * @param obj - объект для обработки
 * @returns объект с преобразованными датами
 */
export function serializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Проверяем, является ли строка датой
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (dateRegex.test(obj)) {
      return new Date(obj) as unknown as T;
    }
    return obj;
  }

  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(item => serializeDates(item)) as unknown as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeDates(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * Рекурсивно преобразует объекты Date в строки ISO
 * @param obj - объект для обработки
 * @returns объект с преобразованными датами в строки
 */
export function deserializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(item => deserializeDates(item)) as unknown as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializeDates(value);
    }
    return result as T;
  }

  return obj;
}
