import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Устанавливаем переменные окружения ДО всех импортов
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_survey_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-32-chars-long';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CORS_ORIGINS = 'http://localhost:8081';
process.env.BODY_LIMIT = '1mb';

// Мокаем переменные окружения перед импортом app
vi.mock('dotenv/config', () => ({}));

// Мокаем env.ts
vi.mock('../../server/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '3001',
    MONGODB_URI: 'mongodb://localhost:27017/test_survey_db',
    JWT_SECRET: 'test-jwt-secret-key-32-chars-long',
    CORS_ORIGINS: 'http://localhost:8081',
    BODY_LIMIT: '1mb',
  },
  getCorsOrigins: () => ['http://localhost:8081'],
}));

// Мокаем MongoDB
vi.mock('../../server/config/database', () => {
  const mockCollection = {
    deleteMany: vi.fn().mockResolvedValue({}),
    insertOne: vi.fn().mockResolvedValue({ insertedId: 'test-id' }),
    findOne: vi.fn().mockImplementation((query: any) => {
      // Мокаем поиск пользователей по email
      if (query.email) {
        const role = query.email.split('@')[0];
        return Promise.resolve({
          email: query.email,
          password: '$2a$10$test',
          role: role,
          _id: `test-user-id-${role}`
        });
      }
      // Мокаем поиск по _id
      if (query._id) {
        return Promise.resolve({
          email: 'admin@test.com',
          password: '$2a$10$test',
          role: 'admin',
          _id: query._id
        });
      }
      return Promise.resolve(null);
    }),
    find: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([])
    }),
  };

  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };

  return {
    DatabaseConfig: {
      connect: vi.fn().mockResolvedValue({}),
      close: vi.fn().mockResolvedValue({}),
      getDb: vi.fn().mockReturnValue(mockDb),
    },
  };
});

// Мокаем AuthService
vi.mock('../../server/services/AuthService', () => {
  const mockAuthService = {
    login: vi.fn(),
    getUserProfile: vi.fn(),
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
  };

  return {
    AuthService: mockAuthService,
  };
});

import app from '../../server/app';
import { AuthService } from '../../server/services/AuthService';
import { DatabaseConfig } from '../../server/config/database';

// Тестовые пользователи с разными ролями
const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin'
  },
  editor: {
    email: 'editor@test.com', 
    password: 'editor123',
    role: 'editor'
  },
  expert: {
    email: 'expert@test.com',
    password: 'expert123', 
    role: 'expert'
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'viewer123',
    role: 'viewer'
  }
};

let authTokens: Record<string, string> = {};

describe('Authorization Integration Tests', () => {
  beforeAll(async () => {
    // Создаем тестовых пользователей (мокированы)
    for (const [role, user] of Object.entries(testUsers)) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      // Пользователи создаются через моки
    }
  });

  afterAll(async () => {
    // await DatabaseConfig.close(); // This line is removed as per the new_code
  });

  beforeEach(async () => {
    // Настраиваем моки для авторизации
    for (const [role, user] of Object.entries(testUsers)) {
      const token = `test-token-${role}`;
      authTokens[role] = token;
      
      // Мокаем verifyToken для каждой роли
      vi.mocked(AuthService.verifyToken).mockImplementation((token: string) => {
        const roleFromToken = token.split('-')[2]; // test-token-{role}
        return {
          userId: `test-user-id-${roleFromToken}`,
          role: roleFromToken
        };
      });
      
      // Мокаем getUserProfile для каждой роли
      vi.mocked(AuthService.getUserProfile).mockImplementation((userId: string) => {
        const roleFromId = userId.split('-')[3]; // test-user-id-{role}
        return {
          id: userId,
          email: `${roleFromId}@test.com`,
          role: roleFromId
        };
      });
    }
  });

  afterEach(async () => {
    // Очищаем тестовые данные (мокированы)
  });

  // Тестовые данные
  const testSurvey = {
    title: 'Test Survey',
    description: 'Test Description',
    status: 'draft'
  };

  describe('Survey Routes Authorization', () => {

    describe('GET /api/surveys', () => {
      it('должен разрешить доступ viewer+', async () => {
        for (const role of ['viewer', 'expert', 'editor', 'admin']) {
          await request(app)
            .get('/api/surveys')
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .expect(200);
        }
      });

      it('должен запретить доступ без токена', async () => {
        await request(app)
          .get('/api/surveys')
          .expect(401);
      });
    });

    describe('POST /api/surveys', () => {
      it('должен разрешить доступ editor+', async () => {
        for (const role of ['editor', 'admin']) {
          await request(app)
            .post('/api/surveys')
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .send(testSurvey)
            .expect(201);
        }
      });

      it('должен запретить доступ viewer и expert', async () => {
        for (const role of ['viewer', 'expert']) {
          await request(app)
            .post('/api/surveys')
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .send(testSurvey)
            .expect(403);
        }
      });
    });

    describe('PUT /api/surveys/:id', () => {
      it('должен разрешить доступ editor+', async () => {
        // Создаем тестовый опрос
        const survey = await vi.mocked(DatabaseConfig.getDb)().collection('surveys').insertOne(testSurvey);
        
        for (const role of ['editor', 'admin']) {
          await request(app)
            .put(`/api/surveys/${survey.insertedId}`)
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .send({ ...testSurvey, title: 'Updated Title' })
            .expect(200);
        }
      });

      it('должен запретить доступ viewer и expert', async () => {
        const survey = await vi.mocked(DatabaseConfig.getDb)().collection('surveys').insertOne(testSurvey);
        
        for (const role of ['viewer', 'expert']) {
          await request(app)
            .put(`/api/surveys/${survey.insertedId}`)
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .send({ ...testSurvey, title: 'Updated Title' })
            .expect(403);
        }
      });
    });

    describe('DELETE /api/surveys/:id', () => {
      it('должен разрешить доступ editor+', async () => {
        for (const role of ['editor', 'admin']) {
          const survey = await vi.mocked(DatabaseConfig.getDb)().collection('surveys').insertOne(testSurvey);
          
          await request(app)
            .delete(`/api/surveys/${survey.insertedId}`)
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .expect(200);
        }
      });

      it('должен запретить доступ viewer и expert', async () => {
        for (const role of ['viewer', 'expert']) {
          const survey = await vi.mocked(DatabaseConfig.getDb)().collection('surveys').insertOne(testSurvey);
          
          await request(app)
            .delete(`/api/surveys/${survey.insertedId}`)
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .expect(403);
        }
      });
    });

    describe('GET /api/surveys/:id/responses', () => {
      it('должен разрешить доступ expert+', async () => {
        const survey = await vi.mocked(DatabaseConfig.getDb)().collection('surveys').insertOne(testSurvey);
        
        for (const role of ['expert', 'editor', 'admin']) {
          await request(app)
            .get(`/api/surveys/${survey.insertedId}/responses`)
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .expect(200);
        }
      });

      it('должен запретить доступ viewer', async () => {
        const survey = await vi.mocked(DatabaseConfig.getDb)().collection('surveys').insertOne(testSurvey);
        
        await request(app)
          .get(`/api/surveys/${survey.insertedId}/responses`)
          .set('Cookie', `auth-token=${authTokens.viewer}`)
          .expect(403);
      });
    });
  });

  describe('File Routes Authorization', () => {
    describe('POST /api/files/upload', () => {
      it('должен разрешить доступ viewer+', async () => {
        for (const role of ['viewer', 'expert', 'editor', 'admin']) {
          await request(app)
            .post('/api/files/upload')
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .attach('file', Buffer.from('test file content'), 'test.txt')
            .expect(201);
        }
      });

      it('должен запретить доступ без токена', async () => {
        await request(app)
          .post('/api/files/upload')
          .attach('file', Buffer.from('test file content'), 'test.txt')
          .expect(401);
      });
    });

    describe('GET /api/files/:fileId', () => {
      it('должен разрешить доступ viewer+', async () => {
        // Создаем тестовый файл
        const fileId = 'test-file-id';
        await vi.mocked(DatabaseConfig.getDb)().collection('files.files').insertOne({
          _id: fileId,
          filename: 'test.txt',
          metadata: { contentType: 'text/plain' }
        });
        
        for (const role of ['viewer', 'expert', 'editor', 'admin']) {
          await request(app)
            .get(`/api/files/${fileId}`)
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .expect(200);
        }
      });
    });
  });

  describe('Utils Routes Authorization', () => {
    describe('GET /api/utils/health', () => {
      it('должен быть публичным', async () => {
        await request(app)
          .get('/api/utils/health')
          .expect(200);
      });
    });

    describe('GET /api/utils/test-connection', () => {
      it('должен разрешить доступ только admin', async () => {
        await request(app)
          .get('/api/utils/test-connection')
          .set('Cookie', `auth-token=${authTokens.admin}`)
          .expect(200);
      });

      it('должен запретить доступ другим ролям', async () => {
        for (const role of ['viewer', 'expert', 'editor']) {
          await request(app)
            .get('/api/utils/test-connection')
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .expect(403);
        }
      });
    });

    describe('POST /api/utils/init-db', () => {
      it('должен разрешить доступ только admin', async () => {
        await request(app)
          .post('/api/utils/init-db')
          .set('Cookie', `auth-token=${authTokens.admin}`)
          .set('X-CSRF-Token', 'test-csrf-token')
          .expect(200);
      });

      it('должен запретить доступ другим ролям', async () => {
        for (const role of ['viewer', 'expert', 'editor']) {
          await request(app)
            .post('/api/utils/init-db')
            .set('Cookie', `auth-token=${authTokens[role]}`)
            .set('X-CSRF-Token', 'test-csrf-token')
            .expect(403);
        }
      });
    });
  });

  describe('CSRF Protection', () => {
    it('должен требовать CSRF токен для POST запросов', async () => {
      await request(app)
        .post('/api/surveys')
        .set('Cookie', `auth-token=${authTokens.editor}`)
        .send(testSurvey)
        .expect(403); // CSRF token missing
    });

    it('должен разрешать GET запросы без CSRF токена', async () => {
      await request(app)
        .get('/api/surveys')
        .set('Cookie', `auth-token=${authTokens.viewer}`)
        .expect(200);
    });
  });
});
