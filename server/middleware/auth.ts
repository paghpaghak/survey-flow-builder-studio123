import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RequestWithUser } from '../types/api';
import { env } from '../config/env';

/**
 * Middleware для проверки JWT токена
 * Добавляет информацию о пользователе в req.user
 */
export function requireAuth(req: RequestWithUser, res: Response, next: NextFunction): void {
  try {
    // Получаем токен из cookie или заголовка Authorization
    const token = req.cookies?.['auth-token'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    } catch (err) {
      res.status(401).json({ error: 'Недействительный токен' });
      return;
    }

    // Добавляем информацию о пользователе в request
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
} 