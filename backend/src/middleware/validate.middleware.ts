import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Generic Zod validation middleware.
 * Validates the specified request property against a Zod schema.
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      // Replace the target with parsed (cleaned) data
      (req as unknown as Record<string, unknown>)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        }));
        console.error(`[Validation Error] on ${req.method} ${req.originalUrl}:`, details);
        res.status(400).json({
          error: 'Error de validación',
          code: 'VALIDATION_ERROR',
          details,
        });
        return;
      }
      next(err);
    }
  };
};
