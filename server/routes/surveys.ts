import { Router } from 'express';
import { SurveyController } from '../controllers/SurveyController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole } from '../middleware/roles.js';

/**
 * Роуты для API опросов
 * Обрабатывает все CRUD операции с опросами и ответами
 */
const router = Router();

// Все маршруты требуют аутентификацию
router.use(requireAuth);

// Основные операции с опросами
router.get('/', requireAnyRole('viewer', 'expert', 'editor', 'admin'), SurveyController.getAll);
router.get('/:id', requireAnyRole('viewer', 'expert', 'editor', 'admin'), SurveyController.getById);
router.post('/', requireAnyRole('editor', 'admin'), SurveyController.create);
router.put('/:id', requireAnyRole('editor', 'admin'), SurveyController.update);
router.delete('/:id', requireAnyRole('editor', 'admin'), SurveyController.delete);

// Операции с ответами на опросы
router.get('/:surveyId/responses', requireAnyRole('expert', 'editor', 'admin'), SurveyController.getResponses);
router.post('/:id/responses', requireAnyRole('viewer', 'expert', 'editor', 'admin'), SurveyController.createResponse);

export default router; 