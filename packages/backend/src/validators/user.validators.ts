import { body, param, query } from 'express-validator';
import { handleValidationErrors } from './auth.validators';

export const userValidators = {
  getUserProfile: [
    param('userId')
      .isUUID()
      .withMessage('Invalid user ID format'),
    handleValidationErrors,
  ],

  updateProfile: [
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('avatarUrl')
      .optional()
      .isURL()
      .withMessage('Invalid avatar URL'),
    
    body('preferredColor')
      .optional()
      .isString()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Preferred color must be a valid hex color'),
    
    handleValidationErrors,
  ],

  getUserStats: [
    param('userId')
      .isUUID()
      .withMessage('Invalid user ID format'),
    handleValidationErrors,
  ],

  searchUsers: [
    query('q')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Search query must be between 2 and 50 characters'),
    handleValidationErrors,
  ],
};