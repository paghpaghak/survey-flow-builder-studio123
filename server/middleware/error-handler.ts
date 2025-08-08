import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES, type ErrorCode } from '../errors/error-codes.js';
import type { ApiResponse } from '../types/api.js';

export class ApiError extends Error {
  constructor(public code: ErrorCode, public details?: unknown) {
    super(code);
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const { status, message } = ERROR_CODES.VALIDATION_ERROR;
    res.status(status).json(<ApiResponse>{ success: false, error: message, data: err.flatten() });
    return;
  }

  // Known API errors
  if (err instanceof ApiError) {
    const { status, message } = ERROR_CODES[err.code];
    res.status(status).json(<ApiResponse>{ success: false, error: message, data: err.details });
    return;
  }

  // Fallback
  const { status, message } = ERROR_CODES.UNKNOWN_ERROR;
  res.status(status).json(<ApiResponse>{ success: false, error: message });
}


