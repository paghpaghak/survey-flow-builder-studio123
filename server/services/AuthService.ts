import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseConfig } from '../config/database.js';
import { AuthResult } from '../types/api.js';
import { env } from '../config/env.js';

/**
 * Сервис для работы с аутентификацией
 * Содержит всю бизнес-логику авторизации и управления пользователями
 */
export class AuthService {
  
  /**
   * Аутентификация пользователя по email и паролю
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    try {
      const db = DatabaseConfig.getDb();
      
      // Поиск пользователя по email
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        throw new Error('Неверный email или пароль');
      }

      // Проверка пароля
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Неверный email или пароль');
      }

      // Генерация JWT токена
      const token = this.generateToken(user._id.toString(), user.role);

      // Подготовка данных пользователя (без пароля)
      const userWithoutPassword = {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }
  
  /**
   * Получение профиля пользователя по ID
   */
  static async getUserProfile(userId: string): Promise<any> {
    try {
      const db = DatabaseConfig.getDb();
      
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Возвращаем данные без пароля
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  }
  
  /**
   * Выход пользователя из системы (новая функция)
   * В будущем можно добавить blacklist токенов
   */
  static async logout(userId: string): Promise<void> {
    try {
      // TODO: В будущем можно добавить инвалидацию токенов
      // Например, сохранение токена в blacklist в Redis или MongoDB
      console.log(`User ${userId} logged out`);
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  }
  
  /**
   * Генерация JWT токена
   */
  private static generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  /**
   * Верификация JWT токена
   */
  static verifyToken(token: string): { userId: string; role: string } | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    } catch {
      return null;
    }
  }
} 