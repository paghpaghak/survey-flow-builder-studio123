import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * <summary>
 * Объединяет классы Tailwind/clsx с учётом условий и переопределений.
 * </summary>
 * <param name="inputs">Список классов и условий</param>
 * <returns>Строка с итоговыми классами</returns>
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Парсит строку и возвращает массив частей: текст и плейсхолдеры вида {{questionId.field}}
 * @param input исходная строка
 * @returns массив частей: { type: 'text' | 'placeholder', value: string, key?: string, field?: string }
 */
export function parsePlaceholders(input: string): Array<
  | { type: 'text'; value: string }
  | { type: 'placeholder'; value: string; key: string; field?: string }
> {
  if (typeof input !== 'string') return [];
  const regex = /\{\{\s*([\w-]+)(?:\.(\w+))?\s*\}\}/g;
  const result: Array<any> = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: input.slice(lastIndex, match.index) });
    }
    result.push({
      type: 'placeholder',
      value: match[0],
      key: match[1],
      field: match[2],
    });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < input.length) {
    result.push({ type: 'text', value: input.slice(lastIndex) });
  }
  return result;
}
