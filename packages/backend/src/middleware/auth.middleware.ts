import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt.utils';
import { AuthService } from '../services/auth.service';
import { AppError } from './error.middleware';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      token = JWTUtils.extractTokenFromHeader(authHeader);
    }

    if (!token) {
      throw new AppError(401, 'No authentication token provided');
    }

    // Validate token and get user ID
    const userId = AuthService.validateAccessToken(token);

    // Attach user ID to request
    req.userId = userId;

    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTHENTICATION_FAILED',
      });
    } else {
      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED',
      });
    }
  }
};

/**
 * Middleware for optional authentication
 * Allows requests to proceed even without valid token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      token = JWTUtils.extractTokenFromHeader(authHeader);
    }

    if (token) {
      try {
        const userId = AuthService.validateAccessToken(token);
        req.userId = userId;
      } catch {
        // Ignore token validation errors for optional auth
      }
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if there's an error
    next();
  }
};