/**
 * Утилита для миграции старых масок (с символом 9) на новые (с символом 0)
 * для совместимости с react-imask
 */

const MASK_MIGRATION_MAP: Record<string, string> = {
  // Старая маска -> Новая маска
  '+7 (999) 999-99-99': '+7 (000) 000-00-00',
  '99.99.9999': '00.00.0000',
  '9999-99-99': '0000-00-00',
  '999-999-999 99': '000-000-000 00',
  '999 999 999': '000 000 000',
  '9999 9999 9999 9999': '0000 0000 0000 0000',
  '99:99:9999999:999': '00:00:0000000:000',
  'AAA-999': 'AAA-000',
  '999999': '000000'
};

/**
 * Мигрирует старую маску на новую
 * @param mask - старая маска
 * @returns новая маска или оригинальная если миграция не нужна
 */
export function migrateMask(mask: string | undefined): string | undefined {
  if (!mask) return mask;
  
  return MASK_MIGRATION_MAP[mask] || mask;
}

/**
 * Проверяет, нужна ли миграция маски
 * @param mask - маска для проверки
 * @returns true если маска требует миграции
 */
export function needsMaskMigration(mask: string | undefined): boolean {
  if (!mask) return false;
  
  return mask in MASK_MIGRATION_MAP;
} 