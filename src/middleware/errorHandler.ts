import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // If headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle MulterError
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds 2MB limit' : err.message
      }
    });
  }

  // Handle AppError
  if (err instanceof AppError) {
    let status = 500;
    if (err.statusCode) {
      status = err.statusCode;
    } else {
      switch (err.code) {
        case 'NOT_FOUND':
          status = 404;
          break;
        case 'FORBIDDEN':
          status = 403;
          break;
        case 'CONFLICT':
          status = 409;
          break;
        case 'BAD_REQUEST':
          status = 400;
          break;
        default:
          status = 500;
      }
    }

    return res.status(status).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Fallback to 500
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  });
}
