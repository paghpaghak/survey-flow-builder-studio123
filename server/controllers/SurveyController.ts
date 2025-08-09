import { Request, Response } from 'express';
import { SurveyService } from '../services/SurveyService';
import { CreateSurveySchema, UpdateSurveySchema, CreateResponseSchema } from '../validation/schemas';
import { ApiError } from '../middleware/error-handler';

/**
 * Контроллер для обработки HTTP запросов к API опросов
 * Тонкий слой между HTTP и бизнес-логикой
 */
export class SurveyController {

  /**
   * @swagger
   * /api/surveys:
   *   get:
   *     summary: Получить список всех опросов
   *     tags: [Surveys]
   *     responses:
   *       200:
   *         description: Список опросов
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Survey'
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const surveys = await SurveyService.getAllSurveys();
      res.json({ success: true, data: surveys });
    } catch (error) {
      console.error('Error in SurveyController.getAll:', error);
      throw new ApiError('DB_ERROR');
    }
  }

  /**
   * @swagger
   * /api/surveys/{id}:
   *   get:
   *     summary: Получить опрос по ID
   *     tags: [Surveys]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Опрос найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Survey'
   *       404:
   *         description: Опрос не найден
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const survey = await SurveyService.getSurveyById(id);
      
      if (!survey) throw new ApiError('NOT_FOUND');
      
      res.json({ success: true, data: survey });
    } catch (error) {
      console.error('Error in SurveyController.getById:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('DB_ERROR');
    }
  }

  /**
   * @swagger
   * /api/surveys:
   *   post:
   *     summary: Создать новый опрос
   *     tags: [Surveys]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Survey'
   *     responses:
   *       201:
   *         description: Опрос создан
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Survey'
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const surveyData = CreateSurveySchema.parse(req.body);
      const newSurvey = await SurveyService.createSurvey(surveyData);
      res.status(201).json({ success: true, data: newSurvey });
    } catch (error) {
      console.error('Error in SurveyController.create:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('DB_ERROR');
    }
  }

  /**
   * @swagger
   * /api/surveys/{id}:
   *   put:
   *     summary: Обновить опрос
   *     tags: [Surveys]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Survey'
   *     responses:
   *       200:
   *         description: Опрос обновлен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Survey'
   *       404:
   *         description: Опрос не найден
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = UpdateSurveySchema.parse(req.body);
      
      const success = await SurveyService.updateSurvey(id, updateData);
      if (!success) throw new ApiError('NOT_FOUND');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error in SurveyController.update:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('DB_ERROR');
    }
  }

  /**
   * @swagger
   * /api/surveys/{id}:
   *   delete:
   *     summary: Удалить опрос
   *     tags: [Surveys]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Опрос удален
   *       404:
   *         description: Опрос не найден
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await SurveyService.deleteSurvey(id);
      
      if (result.deletedSurvey === 0) throw new ApiError('NOT_FOUND');

      res.status(200).json({
        success: true,
        data: {
          message: 'Survey and related responses deleted',
          deletedSurvey: result.deletedSurvey,
          deletedResponses: result.deletedResponses,
        }
      });
    } catch (error) {
      console.error('Error in SurveyController.delete:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('DB_ERROR');
    }
  }

  /**
   * @swagger
   * /api/surveys/{surveyId}/responses:
   *   get:
   *     summary: Получить все ответы на опрос
   *     tags: [Responses]
   *     parameters:
   *       - in: path
   *         name: surveyId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Список ответов
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Response'
   */
  static async getResponses(req: Request, res: Response): Promise<void> {
    try {
      const { surveyId } = req.params;
      const responses = await SurveyService.getSurveyResponses(surveyId);
      res.json({ success: true, data: responses });
    } catch (error) {
      console.error('Error in SurveyController.getResponses:', error);
      throw new ApiError('DB_ERROR');
    }
  }

  /**
   * @swagger
   * /api/surveys/{surveyId}/responses:
   *   post:
   *     summary: Сохранить ответ на опрос
   *     tags: [Responses]
   *     parameters:
   *       - in: path
   *         name: surveyId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Response'
   *     responses:
   *       201:
   *         description: Ответ сохранен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Response'
   */
  static async createResponse(req: Request, res: Response): Promise<void> {
    try {
      const { surveyId } = req.params;
      const responseData = CreateResponseSchema.parse({ ...req.body, surveyId });
      
      const newResponse = await SurveyService.createSurveyResponse(surveyId, responseData);
      res.status(201).json({ success: true, data: newResponse });
    } catch (error) {
      console.error('Error in SurveyController.createResponse:', error);
      throw error;
    }
  }
} 