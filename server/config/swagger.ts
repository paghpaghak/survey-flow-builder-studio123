import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
// @ts-ignore - swagger.js файл без типов
import swaggerSpec from '../swagger.js';

/**
 * Настройка Swagger UI для документации API
 */
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} 