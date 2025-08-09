import { Request } from 'express';

/**
 * Стандартный формат ответа API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Request объект с информацией о пользователе после JWT проверки
 */
export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

/**
 * Результат операции с файлом
 */
export interface FileUploadResult {
  fileId: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Метаданные файла в GridFS
 */
export interface FileMetadata {
  surveyId: string;
  questionId: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Результат аутентификации
 */
export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  token: string;
} 