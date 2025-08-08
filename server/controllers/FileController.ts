import { Request, Response } from 'express';
import { FileService } from '../services/FileService.js';
import { UploadFileSchema } from '../validation/schemas.js';
import { ApiError } from '../middleware/error-handler.js';

/**
 * Контроллер для обработки HTTP запросов работы с файлами
 * Обрабатывает загрузку, скачивание и получение информации о файлах
 */
export class FileController {

  /**
   * @swagger
   * /api/files/upload:
   *   post:
   *     summary: Загрузить файл
   *     tags: [Files]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               surveyId:
   *                 type: string
   *               questionId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Файл успешно загружен
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 fileId:
   *                   type: string
   *                 filename:
   *                   type: string
   *                 size:
   *                   type: number
   *       400:
   *         description: Ошибка валидации
   */
  static async upload(req: Request, res: Response): Promise<void> {
    try {
      // Валидация файла
      if (!req.file) throw new ApiError('FILE_VALIDATION_ERROR', { reason: 'file_missing' });

      // Валидация метаданных
      const { surveyId, questionId } = UploadFileSchema.parse(req.body);

      const result = await FileService.uploadFile(req.file, surveyId, questionId);
      res.json({ success: true, data: result });
      
    } catch (error) {
      console.error('Error in FileController.upload:', error);
      throw error;
    }
  }

  /**
   * @swagger
   * /api/files/{fileId}:
   *   get:
   *     summary: Скачать файл
   *     tags: [Files]
   *     parameters:
   *       - in: path
   *         name: fileId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Файл найден
   *         content:
   *           application/octet-stream:
   *             schema:
   *               type: string
   *               format: binary
   *       404:
   *         description: Файл не найден
   */
  static async download(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      
      if (!fileId) throw new ApiError('BAD_REQUEST', { field: 'fileId' });

      const { stream, metadata } = await FileService.getFileStreamAndMetadata(fileId);

      // Устанавливаем заголовки для скачивания
      res.set({
        'Content-Type': metadata.mimetype,
        'Content-Disposition': `attachment; filename="${metadata.filename}"`,
        'Content-Length': metadata.size,
      });

      // Обрабатываем ошибки потока
      stream.on('error', (error: Error) => {
        console.error('Download stream error:', error);
        if (!res.headersSent) res.status(404).json({ error: 'Файл не найден' });
      });

      // Передаем поток в response
      stream.pipe(res);
      
    } catch (error) {
      console.error('Error in FileController.download:', error);
      
      if (error instanceof Error && error.message.includes('не найден')) {
        throw new ApiError('FILE_NOT_FOUND');
      }
      if (!res.headersSent) throw error;
    }
  }

  /**
   * @swagger
   * /api/files/{fileId}/info:
   *   get:
   *     summary: Получить информацию о файле
   *     tags: [Files]
   *     parameters:
   *       - in: path
   *         name: fileId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Информация о файле
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 fileId:
   *                   type: string
   *                 filename:
   *                   type: string
   *                 size:
   *                   type: number
   *                 mimetype:
   *                   type: string
   *                 uploadedAt:
   *                   type: string
   *       404:
   *         description: Файл не найден
   */
  static async getInfo(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      
      if (!fileId) throw new ApiError('BAD_REQUEST', { field: 'fileId' });

      const fileInfo = await FileService.getFileInfo(fileId);
      res.json({ success: true, data: fileInfo });
      
    } catch (error) {
      console.error('Error in FileController.getInfo:', error);
      
      if (error instanceof Error && error.message.includes('не найден')) {
        throw new ApiError('FILE_NOT_FOUND');
      }
      throw error;
    }
  }
} 