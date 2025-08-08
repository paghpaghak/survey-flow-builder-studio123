import { MongoClient, Db } from 'mongodb';
import { env } from './env.js';

/**
 * Конфигурация и управление подключением к MongoDB
 * Включает инициализацию коллекций и индексов
 */
export class DatabaseConfig {
  private static client: MongoClient;
  private static db: Db;
  
  /**
   * Подключение к MongoDB
   */
  static async connect(): Promise<Db> {
    const uri = env.MONGODB_URI;

    // В продакшене не ослабляем TLS. В dev используем стандартные настройки клиента
    this.client = new MongoClient(uri);

    await this.client.connect();
    this.db = this.client.db('survey_db');

    return this.db;
  }
  
  /**
   * Инициализация коллекций и индексов
   */
  static async initializeCollections(db: Db): Promise<boolean> {
    try {
      // Коллекция опросов
      const surveysCollection = db.collection('surveys');
      await surveysCollection.createIndex({ createdAt: -1 });
      await surveysCollection.createIndex({ title: 'text' });

      // Коллекция вопросов
      const questionsCollection = db.collection('questions');
      await questionsCollection.createIndex({ type: 1 });
      await questionsCollection.createIndex({ title: 'text' });

      // Коллекция ответов
      const responsesCollection = db.collection('responses');
      await responsesCollection.createIndex({ surveyId: 1 });
      await responsesCollection.createIndex({ createdAt: -1 });

      console.log('Collections initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing collections:', error);
      return false;
    }
  }
  
  /**
   * Получение клиента MongoDB
   */
  static getClient(): MongoClient {
    return this.client;
  }
  
  /**
   * Получение объекта базы данных
   */
  static getDb(): Db {
    return this.db;
  }
} 