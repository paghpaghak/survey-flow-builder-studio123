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
