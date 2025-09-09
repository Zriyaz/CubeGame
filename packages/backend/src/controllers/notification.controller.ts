import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import {
  SendInviteRequest,
  GetNotificationsRequest,
  MarkReadRequest,
  UpdatePreferencesRequest,
  NotificationType,
} from '@socket-game/shared';

export class NotificationController {
  /**
   * Get user notifications
   */
  static async getNotifications(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { limit, offset, unreadOnly, type } = req.query as GetNotificationsRequest;

      const result = await NotificationService.getUserNotifications(userId, {
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
        unreadOnly: unreadOnly === true,
        type: type as NotificationType,
      });

      res.json(result);
    } catch (error) {
      logger.error('Failed to get notifications', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Send game invitations
   */
  static async sendInvitations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { gameId, userIds } = req.body as SendInviteRequest;

      if (!gameId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError(400, 'Invalid request: gameId and userIds array are required');
      }

      await NotificationService.sendGameInvitations(gameId, userId, userIds);

      res.json({
        success: true,
        message: `Invitations sent to ${userIds.length} users`,
      });
    } catch (error) {
      logger.error('Failed to send invitations', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { notificationIds } = req.body as MarkReadRequest;

      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new AppError(400, 'Invalid request: notificationIds array is required');
      }

      await NotificationService.markManyAsRead(notificationIds, userId);

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to mark notifications as read', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Mark single notification as read
   */
  static async markOneAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { id } = req.params;

      await NotificationService.markAsRead(id, userId);

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        userId: req.userId,
        notificationId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      await NotificationService.markAllAsRead(userId);

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { id } = req.params;

      await NotificationService.deleteNotification(id, userId);

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete notification', {
        userId: req.userId,
        notificationId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get notification preferences
   */
  static async getPreferences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const preferences = await NotificationService.getUserPreferences(userId);
      
      res.json({
        userId: preferences.user_id || userId,
        gameInvitations: preferences.game_invitations ?? true,
        gameUpdates: preferences.game_updates ?? true,
        achievements: preferences.achievements ?? true,
        systemAnnouncements: preferences.system_announcements ?? true,
        emailNotifications: preferences.email_notifications ?? false,
        pushNotifications: preferences.push_notifications ?? true,
      });
    } catch (error) {
      logger.error('Failed to get notification preferences', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const updates = req.body as UpdatePreferencesRequest;

      const preferences = await NotificationService.updateUserPreferences(userId, updates);

      res.json(preferences);
    } catch (error) {
      logger.error('Failed to update notification preferences', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const count = await NotificationService.getUnreadCount(userId);

      res.json({ count });
    } catch (error) {
      logger.error('Failed to get unread count', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
}
