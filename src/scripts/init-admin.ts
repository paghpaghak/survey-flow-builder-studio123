import { connect } from 'mongoose';
import { User } from '../lib/models/user.model.js';
import { hashPassword } from '../lib/auth.js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Загружаем переменные окружения
dotenv.config();

async function initAdmin() {
  try {
    // Подключение к MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI не найден в переменных окружения');
    }

    console.log('Подключение к MongoDB...');
    await connect(mongoUri);
    console.log('Успешное подключение к MongoDB');

    // Проверяем, существует ли уже админ
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
      console.log('Администратор уже существует');
      process.exit(0);
    }

    // Создаем админа
    const passwordHash = await hashPassword('admin');
    await User.create({
      email: 'admin@example.com',
      passwordHash,
      role: 'admin',
    });

    console.log('Администратор успешно создан');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    process.exit(1);
  }
}

initAdmin(); 