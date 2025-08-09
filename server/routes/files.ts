import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { uploadConfig } from '../config/multer';
import { requireAuth } from '../middleware/auth';
import { requireAnyRole } from '../middleware/roles';

/**
 * Роуты для API файлов
 * Обрабатывает загрузку, скачивание и получение информации о файлах
 */
const router = Router();

// Все маршруты требуют аутентификацию
router.use(requireAuth);

// Загрузка файла (с multer middleware)
router.post('/upload', requireAnyRole('viewer', 'expert', 'editor', 'admin'), uploadConfig.single('file'), FileController.upload);

// Скачивание файла
router.get('/:fileId', requireAnyRole('viewer', 'expert', 'editor', 'admin'), FileController.download);

// Получение информации о файле
router.get('/:fileId/info', requireAnyRole('viewer', 'expert', 'editor', 'admin'), FileController.getInfo);

export default router; 