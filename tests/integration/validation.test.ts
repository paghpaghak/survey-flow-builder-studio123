import { describe, it, expect } from 'vitest';
import { LoginSchema, CreateSurveySchema, UpdateSurveySchema, CreateResponseSchema, UploadFileSchema } from '../../server/validation/schemas.js';

describe('Zod Validation Tests', () => {
  describe('LoginSchema validation', () => {
    it('валидирует корректные данные', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const result = LoginSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('выбрасывает ошибку при невалидном email', () => {
      const invalidData = {
        email: 'bad-email',
        password: 'password123'
      };
      expect(() => LoginSchema.parse(invalidData)).toThrow();
    });

    it('выбрасывает ошибку при коротком пароле', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      };
      expect(() => LoginSchema.parse(invalidData)).toThrow();
    });

    it('выбрасывает ошибку при отсутствии email', () => {
      const invalidData = {
        password: 'password123'
      };
      expect(() => LoginSchema.parse(invalidData)).toThrow();
    });

    it('выбрасывает ошибку при отсутствии password', () => {
      const invalidData = {
        email: 'test@example.com'
      };
      expect(() => LoginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CreateSurveySchema validation', () => {
    it('валидирует корректные данные', () => {
      const validData = {
        title: 'Test Survey',
        description: 'Test Description',
        status: 'draft',
        currentVersion: 1,
        versions: [{
          id: 'v1',
          surveyId: 's1',
          version: 1,
          status: 'draft',
          title: 'Test Survey',
          description: 'Test Description',
          pages: [],
          questions: [],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }]
      };
      const result = CreateSurveySchema.parse(validData);
      expect(result.title).toBe('Test Survey');
    });

    it('выбрасывает ошибку при пустом title', () => {
      const invalidData = {
        title: '',
        status: 'draft',
        currentVersion: 1,
        versions: []
      };
      expect(() => CreateSurveySchema.parse(invalidData)).toThrow();
    });

    it('выбрасывает ошибку при отсутствии title', () => {
      const invalidData = {
        status: 'draft',
        currentVersion: 1,
        versions: []
      };
      expect(() => CreateSurveySchema.parse(invalidData)).toThrow();
    });
  });

  describe('CreateResponseSchema validation', () => {
    it('валидирует корректные данные', () => {
      const validData = {
        surveyId: '507f1f77bcf86cd799439011',
        version: 1,
        answers: [{
          questionId: '507f1f77bcf86cd799439012',
          value: 'test answer',
          timestamp: '2023-01-01T00:00:00.000Z'
        }]
      };
      const result = CreateResponseSchema.parse(validData);
      expect(result.surveyId).toBe('507f1f77bcf86cd799439011');
    });

    it('выбрасывает ошибку при пустом answers', () => {
      const invalidData = {
        surveyId: '507f1f77bcf86cd799439011',
        version: 1,
        answers: []
      };
      expect(() => CreateResponseSchema.parse(invalidData)).toThrow();
    });

    it('выбрасывает ошибку при отсутствии surveyId', () => {
      const invalidData = {
        version: 1,
        answers: [{
          questionId: '507f1f77bcf86cd799439012',
          value: 'test answer',
          timestamp: '2023-01-01T00:00:00.000Z'
        }]
      };
      expect(() => CreateResponseSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UploadFileSchema validation', () => {
    it('валидирует корректные данные', () => {
      const validData = {
        surveyId: '507f1f77bcf86cd799439011',
        questionId: '507f1f77bcf86cd799439012'
      };
      const result = UploadFileSchema.parse(validData);
      expect(result.surveyId).toBe('507f1f77bcf86cd799439011');
    });

    it('выбрасывает ошибку при отсутствии surveyId', () => {
      const invalidData = {
        questionId: '507f1f77bcf86cd799439012'
      };
      expect(() => UploadFileSchema.parse(invalidData)).toThrow();
    });

    it('выбрасывает ошибку при отсутствии questionId', () => {
      const invalidData = {
        surveyId: '507f1f77bcf86cd799439011'
      };
      expect(() => UploadFileSchema.parse(invalidData)).toThrow();
    });
  });
});
