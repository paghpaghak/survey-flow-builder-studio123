import type { CorsOptions } from 'cors';
import { getCorsOrigins } from './env.js';

/**
 * Конфигурация CORS для Express сервера
 * Определяет разрешенные источники, методы и заголовки
 */
export const corsOptions: CorsOptions = {
  origin: getCorsOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200,
};