import { Router } from 'express';
import surveysRouter from './surveys.js';
import authRouter from './auth.js';
import filesRouter from './files.js';
import utilsRouter from './utils.js';

/**
 * Главный роутер API
 * Объединяет все модульные роуты в единую структуру
 */
const router = Router();

// Подключаем модульные роуты
router.use('/surveys', surveysRouter);
router.use('/auth', authRouter);
router.use('/files', filesRouter);

// Утилитарные роуты подключаем напрямую (без префикса)
router.use('/', utilsRouter);

export default router; 