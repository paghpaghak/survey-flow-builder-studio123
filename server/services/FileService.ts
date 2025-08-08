import { ObjectId, GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import { DatabaseConfig } from '../config/database.js';
import { FileUploadResult, FileMetadata } from '../types/api.js';

/**
 * Сервис для работы с файлами через GridFS
 * Содержит всю бизнес-логику загрузки, скачивания и управления файлами
 */
export class FileService {
  
  /**
   * Получение GridFS bucket
   */
  private static getBucket(): GridFSBucket {
    const db = DatabaseConfig.getDb();
    return new GridFSBucket(db, { bucketName: 'uploads' });
  }
  
  /**
   * Загрузка файла в GridFS
   */
  static async uploadFile(
    file: Express.Multer.File,
    surveyId: string,
    questionId: string
  ): Promise<FileUploadResult> {
    return new Promise((resolve, reject) => {
      try {
        const bucket = this.getBucket();
        
        // Создаем поток для загрузки
        const uploadStream = bucket.openUploadStream(file.originalname, {
          metadata: {
            surveyId,
            questionId,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
          } as FileMetadata,
        });

        // Создаем readable stream из buffer
        const readableStream = new Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);

        // Обработчики событий
        uploadStream.on('finish', () => {
          resolve({
            fileId: uploadStream.id.toString(),
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          });
        });

        uploadStream.on('error', (error) => {
          console.error('Upload stream error:', error);
          reject(new Error('Ошибка при загрузке файла'));
        });

        // Запускаем загрузку
        readableStream.pipe(uploadStream);
      } catch (error) {
        console.error('Error in uploadFile:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Получение потока для скачивания файла и его метаданных
   */
  static async getFileStreamAndMetadata(fileId: string): Promise<{
    stream: any;
    metadata: any;
  }> {
    try {
      const bucket = this.getBucket();
      const objectId = new ObjectId(fileId);
      
      // Получаем метаданные файла
      const files = await bucket.find({ _id: objectId }).toArray();
      if (files.length === 0) {
        throw new Error('Файл не найден');
      }

      const file = files[0];
      
      // Создаем поток для скачивания
      const downloadStream = bucket.openDownloadStream(objectId);
      
      return {
        stream: downloadStream,
        metadata: {
          filename: file.filename,
          mimetype: file.metadata?.mimetype || 'application/octet-stream',
          size: file.length,
        }
      };
    } catch (error) {
      console.error('Error in getFileStreamAndMetadata:', error);
      throw error;
    }
  }
  
  /**
   * Получение информации о файле
   */
  static async getFileInfo(fileId: string): Promise<any> {
    try {
      const bucket = this.getBucket();
      const objectId = new ObjectId(fileId);
      
      const files = await bucket.find({ _id: objectId }).toArray();
      if (files.length === 0) {
        throw new Error('Файл не найден');
      }

      const file = files[0];
      
      return {
        fileId: file._id.toString(),
        filename: file.filename,
        size: file.length,
        mimetype: file.metadata?.mimetype,
        uploadedAt: file.uploadDate,
        surveyId: file.metadata?.surveyId,
        questionId: file.metadata?.questionId,
      };
    } catch (error) {
      console.error('Error in getFileInfo:', error);
      throw error;
    }
  }
  
  /**
   * Проверка существования файла
   */
  static async fileExists(fileId: string): Promise<boolean> {
    try {
      const bucket = this.getBucket();
      const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
      return files.length > 0;
    } catch (error) {
      console.error('Error in fileExists:', error);
      return false;
    }
  }
  
  /**
   * Удаление файла (для будущего использования)
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      const bucket = this.getBucket();
      await bucket.delete(new ObjectId(fileId));
      return true;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw error;
    }
  }
} 