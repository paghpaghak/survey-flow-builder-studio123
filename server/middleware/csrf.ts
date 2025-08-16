import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const SKIP_PATHS = new Set<string>([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/csrf-token', // Allow getting CSRF token
]);

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Debug logging
  console.log('CSRF check:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    header: req.header(CSRF_HEADER),
    cookie: req.cookies?.[CSRF_COOKIE],
    hasAuthHeader: !!req.header('Authorization'),
    allHeaders: req.headers,
    allCookies: req.cookies
  });

  if (SAFE.has(req.method) || SKIP_PATHS.has(req.path)) {
    console.log('CSRF: Skipping check for safe method or path');
    next();
    return;
  }

  // For cross-origin requests with authentication, be more lenient
  const hasAuthHeader = !!req.header('Authorization');
  const header = req.header(CSRF_HEADER);
  const cookie = req.cookies?.[CSRF_COOKIE];

  // If user is authenticated (has Authorization header), allow the request
  // even if CSRF token is missing or invalid
  if (hasAuthHeader) {
    console.log('CSRF: User is authenticated, allowing request');
    next();
    return;
  }

  // For unauthenticated requests, require CSRF token
  if (!header || !cookie || header !== cookie) {
    console.log('CSRF: Token validation failed for unauthenticated request', {
      hasHeader: !!header,
      hasCookie: !!cookie,
      headerMatch: header === cookie,
      headerValue: header,
      cookieValue: cookie
    });
    res.status(403).json({ error: 'CSRF token invalid' });
    return;
  }

  console.log('CSRF: Token validation passed');
  next();
}

export function setCsrfCookie(res: Response): void {
  // Небольшой токен, не httpOnly, чтобы фронт мог прочитать и отправить в заголовке
  const token = randomBytes(24).toString('hex');
  console.log('Setting CSRF cookie:', token);
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  });
}


