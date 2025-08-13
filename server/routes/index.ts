import { Router } from 'express';
import surveysRouter from './surveys';
import authRouter from './auth';
import filesRouter from './files';
import utilsRouter from './utils';

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