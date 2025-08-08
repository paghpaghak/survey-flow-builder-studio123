import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const SKIP_PATHS = new Set<string>([
  '/api/auth/login',
  '/api/auth/logout',
]);

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE.has(req.method) || SKIP_PATHS.has(req.path)) {
    next();
    return;
  }

  const header = req.header(CSRF_HEADER);
  const cookie = req.cookies?.[CSRF_COOKIE];

  if (!header || !cookie || header !== cookie) {
    res.status(403).json({ error: 'CSRF token invalid' });
    return;
  }

  next();
}

export function setCsrfCookie(res: Response): void {
  // Небольшой токен, не httpOnly, чтобы фронт мог прочитать и отправить в заголовке
  const token = randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  });
}


