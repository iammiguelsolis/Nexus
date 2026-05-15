import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Global error handler middleware.
 * Returns JSON errors with a correlation ID for tracing.
 */
export const errorMiddleware = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = crypto.randomUUID();
  const statusCode = err.statusCode || 500;

  console.error(`[ERROR] ${correlationId}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode,
  });

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Error interno del servidor' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    correlationId,
    ...(process.env.NODE_ENV === 'development' && { details: err.details || err.message }),
  });
};

/**
 * Helper to create typed errors with status codes
 */
export class HttpError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'HttpError';
  }
}
