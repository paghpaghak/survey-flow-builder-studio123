import { Router } from 'express';
import { UtilsController } from '../controllers/UtilsController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

/**
 * Роуты для утилитарных эндпоинтов
 * Включает health check, тестирование подключения к БД и инициализацию
 */
const router = Router();

// Health check (публичный)
router.get('/health', UtilsController.healthCheck);

// Оставшиеся утилитарные маршруты только для admin
router.use(requireAuth, requireRole('admin'));

// Тестирование подключения к MongoDB
router.get('/test-connection', UtilsController.testConnection);

// Инициализация базы данных
router.post('/init-db', UtilsController.initializeDatabase);

export default router; 