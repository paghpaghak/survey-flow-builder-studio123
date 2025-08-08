import multer from 'multer';

/**
 * Конфигурация Multer для загрузки файлов в память
 * Используется для последующей передачи в GridFS
 */
export const uploadConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB лимит
  },
}); 