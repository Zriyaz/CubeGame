import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'general',
      message: error.msg,
    }));

    logger.warn('Validation failed', {
      endpoint: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      ip: req.ip,
    });

    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errorMessages,
    });
    return;
  }

  next();
};

/**
 * Validators for auth endpoints
 */
export const authValidators = {
  refreshToken: [
    body('refreshToken')
      .optional()
      .isString()
      .withMessage('Refresh token must be a string')
      .notEmpty()
      .withMessage('Refresh token cannot be empty'),
    handleValidationErrors,
  ],
};