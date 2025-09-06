import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { JWTUtils } from '../utils/jwt.utils';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: any; // Will be populated by Passport
  userId?: string; // Will be populated by auth middleware
}

export class AuthController {
  /**
   * Handle Google OAuth callback
   * This is called by Passport after successful Google authentication
   */
  static async googleCallback(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        logger.error('Google OAuth callback - no user in request');
        throw new AppError(401, 'Authentication failed');
      }

      logger.info('Processing Google OAuth callback', {
        googleId: req.user.id,
        email: req.user.emails?.[0]?.value,
      });

      // req.user contains the Google profile from Passport
      const authResponse = await AuthService.authenticateWithGoogle(req.user);

      logger.info('User authenticated successfully', {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        isNewUser: !authResponse.user.created_at,
      });

      // Set secure HTTP-only cookies
      res.cookie('access_token', authResponse.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('refresh_token', authResponse.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      logger.info('Auth cookies set, redirecting to dashboard', {
        userId: authResponse.user.id,
      });

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/dashboard`);
    } catch (error) {
      logger.error('Google OAuth callback error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies.refresh_token || req.body.refreshToken;

      logger.info('Token refresh requested', {
        hasCookieToken: !!req.cookies.refresh_token,
        hasBodyToken: !!req.body.refreshToken,
        ip: req.ip,
      });

      if (!refreshToken) {
        logger.warn('Refresh token not provided in request');
        throw new AppError(401, 'Refresh token not provided');
      }

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      logger.info('Token refreshed successfully');

      // Update cookies
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: 'Token refreshed successfully',
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      next(error);
    }
  }

  /**
   * Logout user
   */
  static async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('Logout requested', {
        userId: req.userId,
        ip: req.ip,
      });

      if (req.userId) {
        await AuthService.logout(req.userId);
      }

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      logger.info('User logged out successfully', {
        userId: req.userId,
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId,
      });
      next(error);
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        logger.warn('Get current user called without userId');
        throw new AppError(401, 'Unauthorized');
      }

      logger.info('Getting current user', {
        userId: req.userId,
      });

      const user = await AuthService.getCurrentUser(req.userId);

      logger.info('Current user retrieved', {
        userId: user.id,
        email: user.email,
      });

      res.json({ user });
    } catch (error) {
      logger.error('Get current user failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId,
      });
      next(error);
    }
  }

  /**
   * Handle authentication failure
   */
  static authFailure(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    logger.warn('Authentication failure redirect', {
      ip: req.ip,
      referer: req.get('referer'),
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }

  /**
   * Get WebSocket token
   */
  static async getWebSocketToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get access token from cookies
      const accessToken = req.cookies.access_token;
      
      if (!accessToken) {
        res.status(401).json({ error: 'No access token found' });
        return;
      }

      logger.info('WebSocket token requested', { userId: req.userId });

      // Return the token that can be used for WebSocket
      res.json({ token: accessToken });
    } catch (error) {
      logger.error('Failed to get WebSocket token:', error);
      next(error);
    }
  }
}