import { Request, Response } from 'express';
import { DatabaseConfig } from '../config/database.js';
import { setCsrfCookie } from '../middleware/csrf.js';

/**
 * Контроллер для утилитарных HTTP эндпоинтов
 * Включает health check, тестирование подключения к БД и инициализацию
 */
export class UtilsController {

  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Проверка здоровья сервера
   *     tags: [Utils]
   *     responses:
   *       200:
   *         description: Сервер работает
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  }

  /**
   * @swagger
   * /api/csrf-token:
   *   get:
   *     summary: Получить CSRF токен
   *     tags: [Utils]
   *     responses:
   *       200:
   *         description: CSRF токен получен
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   */
  static async getCsrfToken(req: Request, res: Response): Promise<void> {
    setCsrfCookie(res);
    res.json({ 
      success: true, 
      data: { message: 'CSRF token set' } 
    });
  }

  /**
   * @swagger
   * /api/test-connection:
   *   get:
   *     summary: Тестирование подключения к MongoDB
   *     tags: [Utils]
   *     responses:
   *       200:
   *         description: Подключение успешно
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 collections:
   *                   type: array
   *                   items:
   *                     type: string
   *       500:
   *         description: Ошибка подключения
   */
  static async testConnection(req: Request, res: Response): Promise<void> {
    try {
      console.log('Testing MongoDB connection...');
      
      // Используем уже настроенное подключение
      const db = DatabaseConfig.getDb();
      const collections = await db.listCollections().toArray();
      
      res.json({
        success: true,
        data: {
          message: 'Successfully connected to MongoDB',
          collections: collections.map(col => col.name)
        }
      });
    } catch (error) {
      console.error('MongoDB connection test error:', error);
      throw new (await import('../middleware/error-handler.js')).ApiError('DB_ERROR');
    }
  }

  /**
   * @swagger
   * /api/init-db:
   *   post:
   *     summary: Инициализировать базу данных
   *     description: Создает необходимые коллекции и индексы в базе данных
   *     tags: [Database]
   *     responses:
   *       200:
   *         description: База данных успешно инициализирована
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       500:
   *         description: Ошибка при инициализации базы данных
   */
  static async initializeDatabase(req: Request, res: Response): Promise<void> {
    try {
      const db = DatabaseConfig.getDb();
      const success = await DatabaseConfig.initializeCollections(db);
      
      if (success) {
        res.json({ success: true, data: { message: 'Database collections initialized successfully' } });
      } else {
        throw new (await import('../middleware/error-handler.js')).ApiError('DB_ERROR');
      }
    } catch (error) {
      console.error('Error in UtilsController.initializeDatabase:', error);
      throw new (await import('../middleware/error-handler.js')).ApiError('DB_ERROR');
    }
  }
} 