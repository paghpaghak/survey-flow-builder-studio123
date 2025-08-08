import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import { csrfProtection } from './middleware/csrf.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

/**
 * Настройка Express приложения
 * Включает все middleware, роуты и конфигурацию
 */
function createApp(): express.Application {
  const app = express();

  // Базовый middleware
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    })
  );

  // Глобальный rate limit для снижения риска DoS/брутфорса
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Swagger документация
  setupSwagger(app);

  // API роуты
  app.use(csrfProtection);
  app.use('/api', apiRoutes);

  // Обработчик для несуществующих роутов
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      path: req.originalUrl 
    });
  });

  // Глобальный обработчик ошибок (унифицированный)
  app.use(errorHandler);

  return app;
}

export default createApp(); 