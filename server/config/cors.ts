import type { CorsOptions } from 'cors';
import { getCorsOrigins } from './env';

/**
 * Конфигурация CORS для Express сервера
 * Определяет разрешенные источники, методы и заголовки
 */
export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getCorsOrigins();
    console.log('CORS check:', { origin, allowedOrigins });
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200,
};