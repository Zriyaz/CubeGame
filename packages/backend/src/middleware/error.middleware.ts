import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { HTTP_STATUS, ERROR_CODES } from '@socket-game/shared';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  logger.error('Error caught by error handler', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code || ERROR_CODES.SERVER_ERROR,
        message: err.message,
      },
    });
  }

  // Default error response
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: {
      code: ERROR_CODES.SERVER_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message,
    },
  });
};