import { z } from 'zod';

/**
 * Валидация переменных окружения и экспорт безопасной конфигурации
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI обязателен'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть длиной не менее 32 символов'),
  CORS_ORIGINS: z.string().optional(), // список через запятую
  BODY_LIMIT: z.string().default('1mb'),
});

export const env = EnvSchema.parse(process.env);

export function getCorsOrigins(): string[] {
  const origins = env.CORS_ORIGINS ?? 'http://localhost:8081';
  const fallbackOrigins = [
    'http://localhost:8081',
    'https://survey-flow-builder-studio123.vercel.app',
    'https://survey-flow-builder-studio123-lmntorcdu.vercel.app',
    'https://*.vercel.app'
  ];
  
  const configuredOrigins = origins.split(',').map((s) => s.trim()).filter(Boolean);
  const allOrigins = [...configuredOrigins, ...fallbackOrigins];
  
  console.log('CORS origins:', allOrigins);
  return allOrigins;
}


