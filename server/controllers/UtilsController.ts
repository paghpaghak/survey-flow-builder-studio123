import { Request, Response } from 'express';
import { DatabaseConfig } from '../config/database.js';

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
      res.status(500).json({
        success: false,
        error: 'Failed to connect to MongoDB',
        data: { message: error instanceof Error ? error.message : 'Unknown error' }
      });
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
        res.status(500).json({ success: false, error: 'Failed to initialize collections' });
      }
    } catch (error) {
      console.error('Error in UtilsController.initializeDatabase:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize database',
        data: { message: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }
} 