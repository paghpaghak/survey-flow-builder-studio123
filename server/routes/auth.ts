import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Роуты для API аутентификации
 * Включает login, profile и новый logout эндпоинт
 */
const router = Router();

// Публичные роуты (без аутентификации)
router.post('/login', AuthController.login);

// Защищенные роуты (требуют аутентификации)
router.get('/me', requireAuth, AuthController.getProfile);
router.post('/logout', requireAuth, AuthController.logout);

export default router; 