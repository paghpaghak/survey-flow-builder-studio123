import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { RequestWithUser } from '../types/api';
import { setCsrfCookie } from '../middleware/csrf';
import { LoginSchema } from '../validation/schemas';
import { ApiError } from '../middleware/error-handler';
import { ERROR_CODES } from '../errors/error-codes';

/**
 * Контроллер для обработки HTTP запросов аутентификации
 * Включает новый logout эндпоинт
 */
export class AuthController {

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Вход пользователя
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Успешный вход
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *       401:
   *         description: Неверный email или пароль
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = LoginSchema.parse(req.body);

      const authResult = await AuthService.login(email, password);

      // Устанавливаем httpOnly cookie с токеном и отдельный csrf-token (не httpOnly)
      res
        .cookie('auth-token', authResult.token, {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 1 день
        });

      setCsrfCookie(res);

      // Не отправляем токен в теле ответа
      res.json({ success: true, data: { user: authResult.user } });
        
    } catch (error) {
      console.error('Error in AuthController.login:', error);
      if (error instanceof Error && error.message.includes('Неверный email или пароль')) {
        throw new ApiError('AUTH_INVALID_CREDENTIALS');
      }
      throw error;
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Получить информацию о текущем пользователе
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Информация о пользователе
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *       401:
   *         description: Не авторизован
   */
  static async getProfile(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) throw new ApiError('AUTH_REQUIRED');

      const user = await AuthService.getUserProfile(req.user.userId);
      res.json({ success: true, data: { user } });
      
    } catch (error) {
      console.error('Error in AuthController.getProfile:', error);
      if (error instanceof Error && error.message.includes('Пользователь не найден')) {
        throw new ApiError('NOT_FOUND', { resource: 'user' });
      }
      throw error;
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Выход пользователя из системы
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Успешный выход
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Не авторизован
   */
  static async logout(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) throw new ApiError('AUTH_REQUIRED');

      await AuthService.logout(req.user.userId);

      // Очищаем cookie
      res
        .clearCookie('auth-token')
        .clearCookie('csrf-token')
        .json({ 
          success: true,
          data: { message: 'Успешный выход из системы' } 
        });
        
    } catch (error) {
      console.error('Error in AuthController.logout:', error);
      throw error;
    }
  }
} 