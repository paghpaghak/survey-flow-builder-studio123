import { Request, Response } from 'express';
import { SurveyService } from '../services/SurveyService.js';
import { CreateSurveySchema, UpdateSurveySchema, CreateResponseSchema } from '../validation/schemas.js';
import { ApiError } from '../middleware/error-handler.js';

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
      res.status(500).json({ success: false, error: 'Failed to fetch surveys' });
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
      
      if (!survey) {
        res.status(404).json({ success: false, error: 'Survey not found' });
        return;
      }
      
      res.json({ success: true, data: survey });
    } catch (error) {
      console.error('Error in SurveyController.getById:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch survey' });
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
      res.status(500).json({ success: false, error: 'Failed to create survey' });
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
      
      if (!success) {
        res.status(404).json({ success: false, error: 'Survey not found' });
        return;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error in SurveyController.update:', error);
      res.status(500).json({ success: false, error: 'Failed to update survey' });
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
      
      if (result.deletedSurvey === 0) {
        res.status(404).json({ success: false, error: 'Survey not found' });
        return;
      }

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
      res.status(500).json({ success: false, error: 'Failed to delete survey' });
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
      res.status(500).json({ success: false, error: 'Failed to fetch responses' });
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