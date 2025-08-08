import { ObjectId } from 'mongodb';
import { DatabaseConfig } from '../config/database.js';
// @ts-ignore - serializeDates.js файл без типов
import { serializeDates } from '../utils/serializeDates.js';

/**
 * Сервис для работы с опросами
 * Содержит всю бизнес-логику операций CRUD
 */
export class SurveyService {
  
  /**
   * Получение всех опросов с сортировкой по дате создания
   */
  static async getAllSurveys(): Promise<any[]> {
    try {
      const db = DatabaseConfig.getDb();
      const surveys = await db.collection('surveys')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      // Преобразуем _id в id для совместимости с фронтендом
      return surveys.map(survey => ({
        ...survey,
        id: survey._id?.toString(),
      }));
    } catch (error) {
      console.error('Error in getAllSurveys:', error);
      throw error;
    }
  }
  
  /**
   * Получение опроса по ID
   */
  static async getSurveyById(id: string): Promise<any | null> {
    try {
      const db = DatabaseConfig.getDb();
      const survey = await db.collection('surveys')
        .findOne({ _id: new ObjectId(id) });
      
      return survey;
    } catch (error) {
      console.error('Error in getSurveyById:', error);
      throw error;
    }
  }
  
  /**
   * Создание нового опроса
   */
  static async createSurvey(surveyData: any): Promise<any> {
    try {
      const db = DatabaseConfig.getDb();
      
      const survey = {
        ...surveyData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('surveys').insertOne(survey);
      
      return { 
        ...survey, 
        _id: result.insertedId 
      };
    } catch (error) {
      console.error('Error in createSurvey:', error);
      throw error;
    }
  }
  
  /**
   * Обновление опроса
   */
  static async updateSurvey(id: string, updateData: any): Promise<boolean> {
    try {
      const db = DatabaseConfig.getDb();
      const surveyId = new ObjectId(id);
      
      // Подготавливаем данные для обновления, преобразуя даты
      const serializedData = serializeDates(updateData);
      
      const result = await db.collection('surveys').updateOne(
        { _id: surveyId },
        { $set: serializedData }
      );
      
      return result.matchedCount > 0;
    } catch (error) {
      console.error('Error in updateSurvey:', error);
      throw error;
    }
  }
  
  /**
   * Удаление опроса с каскадным удалением ответов
   */
  static async deleteSurvey(id: string): Promise<{deletedSurvey: number, deletedResponses: number}> {
    try {
      const db = DatabaseConfig.getDb();
      const surveyObjectId = new ObjectId(id);
      
      // Удаляем опрос
      const surveyResult = await db.collection('surveys')
        .deleteOne({ _id: surveyObjectId });
      
      // Каскадное удаление ответов
      const responsesResult = await db.collection('responses')
        .deleteMany({ surveyId: surveyObjectId });
      
      return {
        deletedSurvey: surveyResult.deletedCount,
        deletedResponses: responsesResult.deletedCount,
      };
    } catch (error) {
      console.error('Error in deleteSurvey:', error);
      throw error;
    }
  }
  
  /**
   * Получение всех ответов на опрос
   */
  static async getSurveyResponses(surveyId: string): Promise<any[]> {
    try {
      const db = DatabaseConfig.getDb();
      const responses = await db.collection('responses')
        .find({ surveyId: new ObjectId(surveyId) })
        .sort({ createdAt: -1 })
        .toArray();
      
      return responses;
    } catch (error) {
      console.error('Error in getSurveyResponses:', error);
      throw error;
    }
  }
  
  /**
   * Создание ответа на опрос
   */
  static async createSurveyResponse(surveyId: string, responseData: any): Promise<any> {
    try {
      const db = DatabaseConfig.getDb();
      
      const response = {
        surveyId: new ObjectId(surveyId),
        answers: responseData.answers,
        createdAt: new Date()
      };
      
      const result = await db.collection('responses').insertOne(response);
      
      return { 
        ...response, 
        _id: result.insertedId 
      };
    } catch (error) {
      console.error('Error in createSurveyResponse:', error);
      throw error;
    }
  }
} 