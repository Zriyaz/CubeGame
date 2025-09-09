import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from './auth.controller';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class UserController {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      logger.info('Get user profile requested', { userId });

      const user = await UserService.getUserById(userId);

      if (!user) {
        logger.warn('User not found', { userId });
        throw new AppError(404, 'User not found');
      }

      res.json({ user });
    } catch (error) {
      logger.error('Failed to get user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.params.userId,
      });
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  static async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { name, avatar_url, preferred_color } = req.body;

      logger.info('Update profile requested', {
        userId: req.userId,
        updates: { name: !!name, avatar_url: !!avatar_url, preferred_color: !!preferred_color },
      });

      const updatedUser = await UserService.updateProfile(req.userId, {
        name,
        avatar_url,
        preferred_color,
      });

      logger.info('Profile updated successfully', {
        userId: updatedUser.id,
        name: updatedUser.name,
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      logger.error('Failed to update profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId,
      });
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      logger.info('Get user stats requested', { userId });

      const stats = await UserService.getUserStats(userId);

      res.json({ stats });
    } catch (error) {
      logger.error('Failed to get user stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.params.userId,
      });
      next(error);
    }
  }

  /**
   * Search users
   */
  static async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        logger.warn('Invalid search query', { query: q });
        res.json({ users: [] });
        return;
      }

      logger.info('User search requested', { query: q });

      const users = await UserService.searchUsers(q);

      logger.info('User search completed', {
        query: q,
        resultCount: users.length,
      });

      res.json({ users });
    } catch (error) {
      logger.error('Failed to search users', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query.q,
      });
      next(error);
    }
  }

  /**
   * Get current user profile (alias for auth/me with more details)
   */
  static async getCurrentUserProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Unauthorized');
      }

      logger.info('Get current user profile requested', {
        userId: req.userId,
      });

      const [user, stats] = await Promise.all([
        UserService.getUserById(req.userId),
        UserService.getUserStats(req.userId),
      ]);

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({ user, stats });
    } catch (error) {
      logger.error('Failed to get current user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId,
      });
      next(error);
    }
  }

  /**
   * Get active users
   */
  static async getActiveUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('Get active users requested');

      const activeUsers = await UserService.getActiveUsers();
      
      res.json({ users: activeUsers, count: activeUsers.length });
    } catch (error) {
      logger.error('Failed to get active users', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get online users (excludes current user)
   */
  static async getOnlineUsers(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Unauthorized');
      }

      logger.info('Get online users requested', { userId: req.userId });

      const onlineUsers = await UserService.getOnlineUsers(req.userId);
      
      res.json({ users: onlineUsers });
    } catch (error) {
      logger.error('Failed to get online users', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.userId,
      });
      next(error);
    }
  }
}