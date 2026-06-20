import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: err.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          }
        });
      }
      next(err);
    }
  };
}
