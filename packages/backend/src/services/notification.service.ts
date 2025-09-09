import { Server } from 'socket.io';
import { NotificationRepository } from '../repositories/notification.repository';
import { UserRepository } from '../repositories/user.repository';
import { GameRepository } from '../repositories/game.repository';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { CreateNotificationDto, Notification, NotificationType } from '@socket-game/shared';
import { WS_SERVER_EVENTS, ROOM_PREFIXES, GAME_STATUS } from '@socket-game/shared/constants';
import { AppError } from '../middleware/error.middleware';

export class NotificationService {
  private static notificationRepo = new NotificationRepository();
  private static userRepo = new UserRepository();
  private static gameRepo = new GameRepository();
  private static io: Server | null = null;
  
  private static get redisClient() {
    return getRedisClient();
  }

  /**
   * Initialize the service with Socket.io instance
   */
  static initialize(io: Server) {
    this.io = io;
  }

  /**
   * Create a new instance with Socket.io for WebSocket handlers
   */
  constructor(private socketIo?: Server) {
    if (socketIo) {
      NotificationService.io = socketIo;
    }
  }

  // Instance methods for WebSocket handlers
  async sendGameInvitations(gameId: string, hostId: string, userIds: string[]) {
    return NotificationService.sendGameInvitations(gameId, hostId, userIds);
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId: string): Promise<any> {
    try {
      let preferences = await this.notificationRepo.getPreferences(userId);
      
      // If no preferences exist, create defaults
      if (!preferences) {
        preferences = {
          user_id: userId,
          game_invitations: true,
          game_updates: true,
          achievements: true,
          system_announcements: true,
          email_notifications: false,
          push_notifications: true,
        };
        
        // Try to create default preferences
        try {
          await this.notificationRepo.updatePreferences(userId, preferences);
        } catch (createError) {
          logger.warn('Could not create default preferences', {
            userId,
            error: createError instanceof Error ? createError.message : 'Unknown error'
          });
        }
      }
      
      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences', { error, userId });
      // Return defaults on error
      return {
        user_id: userId,
        game_invitations: true,
        game_updates: true,
        achievements: true,
        system_announcements: true,
        email_notifications: false,
        push_notifications: true,
      };
    }
  }

  async getUnreadCount(userId: string) {
    return NotificationService.getUnreadCount(userId);
  }

  async getUnreadNotifications(userId: string) {
    const result = await NotificationService.getUserNotifications(userId, {
      unreadOnly: true,
      limit: 10,
    });
    return result.notifications;
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    return NotificationService.markManyAsRead(notificationIds, userId);
  }

  async markAllAsRead(userId: string) {
    return NotificationService.markAllAsRead(userId);
  }

  async updatePreferences(userId: string, preferences: any) {
    return NotificationService.updateUserPreferences(userId, preferences);
  }

  /**
   * Update user notification preferences
   */
  static async updateUserPreferences(userId: string, updates: any): Promise<any> {
    try {
      const updatedPreferences = await this.notificationRepo.updatePreferences(userId, updates);
      return updatedPreferences;
    } catch (error) {
      logger.error('Failed to update user preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Create and send a notification
   */
  static async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      // Check user preferences - allow notifications if no preferences exist
      let preferences = null;
      try {
        preferences = await this.notificationRepo.getPreferences(data.userId);
      } catch (prefError) {
        // If error getting preferences, allow the notification
        logger.debug('Error getting preferences, allowing notification', {
          userId: data.userId,
          type: data.type,
          error: prefError instanceof Error ? prefError.message : 'Unknown error'
        });
      }
      
      if (preferences && !this.shouldSendNotification(data.type, preferences)) {
        logger.info('Notification blocked by user preferences', {
          userId: data.userId,
          type: data.type,
        });
        throw new AppError(400, 'User has disabled this notification type');
      }

      // Create notification in database
      const notification = await this.notificationRepo.create({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        expires_at: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      // Map to shared type
      const mappedNotification: Notification = {
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        status: notification.status,
        readAt: notification.read_at,
        createdAt: notification.created_at,
        expiresAt: notification.expires_at,
      };

      // Send via WebSocket if user is online
      if (this.io) {
        const userRoom = `${ROOM_PREFIXES.USER}${data.userId}`;
        logger.info('Sending notification via WebSocket', {
          userId: data.userId,
          room: userRoom,
          notificationId: notification.id,
          hasIo: !!this.io,
        });
        
        // Get sockets in the room to verify user is connected
        const socketsInRoom = await this.io.in(userRoom).fetchSockets();
        logger.info('Sockets in user room', {
          room: userRoom,
          socketCount: socketsInRoom.length,
          socketIds: socketsInRoom.map(s => s.id),
        });
        
        this.io.to(userRoom).emit(WS_SERVER_EVENTS.NOTIFICATION_RECEIVED, {
          notification: mappedNotification,
        });
      } else {
        logger.warn('Socket.IO not initialized, cannot send real-time notification', {
          userId: data.userId,
        });
      }

      // Update unread count in cache
      await this.updateUnreadCountCache(data.userId);

      return mappedNotification;
    } catch (error) {
      logger.error('Failed to create notification', { error, data });
      throw error;
    }
  }

  /**
   * Send game invitations
   */
  static async sendGameInvitations(
    gameId: string,
    inviterId: string,
    recipientIds: string[]
  ): Promise<Array<{ userId: string; success: boolean; error?: string }>> {
    try {
      // Validate game exists and is in waiting status
      const game = await this.gameRepo.findById(gameId);
      if (!game) {
        throw new AppError(404, 'Game not found');
      }

      if (game.status !== GAME_STATUS.WAITING) {
        throw new AppError(400, 'Can only send invitations for games in waiting status');
      }

      if (game.creator_id !== inviterId) {
        throw new AppError(403, 'Only the game host can send invitations');
      }

      // Get inviter details
      const inviter = await this.userRepo.findById(inviterId);
      if (!inviter) {
        throw new AppError(404, 'Inviter not found');
      }

      // Get game participants to avoid inviting existing players
      const participants = await this.gameRepo.getParticipants(gameId);
      const participantIds = new Set(participants.map((p) => p.user_id));

      // Filter out users who are already in the game
      const validRecipientIds = recipientIds.filter((id) => !participantIds.has(id));

      if (validRecipientIds.length === 0) {
        throw new AppError(400, 'All invited users are already in the game');
      }

      // Create notifications for each recipient
      const notifications: CreateNotificationDto[] = validRecipientIds.map((userId) => ({
        userId,
        type: NotificationType.GAME_INVITATION,
        title: 'Game Invitation',
        message: `${inviter.name} has invited you to join "${game.name}"`,
        data: {
          gameId: game.id,
          inviterId: inviter.id,
          inviterName: inviter.name,
          inviterAvatar: inviter.avatar_url,
          gameName: game.name,
          gameStatus: game.status,
          actionUrl: `/game/${game.id}/room`,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }));

      // Create notifications in batch and track results
      const results = await Promise.allSettled(
        notifications.map(async (notif) => {
          try {
            await this.createNotification(notif);
            return { userId: notif.userId, success: true };
          } catch (error) {
            return {
              userId: notif.userId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      const finalResults = results.map((result) =>
        result.status === 'fulfilled'
          ? result.value
          : {
              userId: '',
              success: false,
              error: 'Failed to send',
            }
      );

      logger.info('Game invitations sent', {
        gameId,
        inviterId,
        recipientCount: validRecipientIds.length,
        successCount: finalResults.filter((r) => r.success).length,
      });

      return finalResults;
    } catch (error) {
      logger.error('Failed to send game invitations', { error, gameId, inviterId });
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    try {
      const { notifications, total } = await this.notificationRepo.findByUser(userId, options);
      const unreadCount = await this.notificationRepo.getUnreadCount(userId);

      // Map to shared type
      const mappedNotifications: Notification[] = notifications.map((notif) => ({
        id: notif.id,
        userId: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        data: notif.data,
        status: notif.status,
        readAt: notif.read_at,
        createdAt: notif.created_at,
        expiresAt: notif.expires_at,
      }));

      return { notifications: mappedNotifications, total, unreadCount };
    } catch (error) {
      logger.error('Failed to get user notifications', { error, userId, options });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const success = await this.notificationRepo.markAsRead(notificationId, userId);

      if (!success) {
        throw new AppError(404, 'Notification not found or already read');
      }

      // Send read receipt via WebSocket
      if (this.io) {
        const userRoom = `${ROOM_PREFIXES.USER}${userId}`;
        this.io.to(userRoom).emit(WS_SERVER_EVENTS.NOTIFICATION_READ, {
          notificationId,
          userId,
          readAt: new Date(),
        });
      }

      // Update unread count
      await this.updateUnreadCountCache(userId);
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId, userId });
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markManyAsRead(notificationIds: string[], userId: string): Promise<void> {
    try {
      const count = await this.notificationRepo.markManyAsRead(notificationIds, userId);

      if (count === 0) {
        throw new AppError(404, 'No notifications found to mark as read');
      }

      // Update unread count
      await this.updateUnreadCountCache(userId);
    } catch (error) {
      logger.error('Failed to mark notifications as read', { error, notificationIds, userId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepo.markAllAsRead(userId);
      await this.updateUnreadCountCache(userId);
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const success = await this.notificationRepo.delete(notificationId, userId);

      if (!success) {
        throw new AppError(404, 'Notification not found');
      }

      // Send delete event via WebSocket
      if (this.io) {
        const userRoom = `${ROOM_PREFIXES.USER}${userId}`;
        this.io.to(userRoom).emit(WS_SERVER_EVENTS.NOTIFICATION_DELETED, {
          notificationId,
        });
      }

      // Update unread count
      await this.updateUnreadCountCache(userId);
    } catch (error) {
      logger.error('Failed to delete notification', { error, notificationId, userId });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Try to get from cache first
      const cached = await this.redisClient.get(`notification_count:${userId}`);
      if (cached !== null) {
        return parseInt(cached);
      }

      // Get from database
      const count = await this.notificationRepo.getUnreadCount(userId);

      // Cache for 5 minutes
      await this.redisClient.set(`notification_count:${userId}`, count.toString(), 'EX', 300);

      return count;
    } catch (error) {
      logger.error('Failed to get unread count', { error, userId });
      throw error;
    }
  }

  /**
   * Update unread count cache and notify user
   */
  private static async updateUnreadCountCache(userId: string): Promise<void> {
    try {
      const count = await this.notificationRepo.getUnreadCount(userId);

      // Update cache
      await this.redisClient.set(`notification_count:${userId}`, count.toString(), 'EX', 300);

      // Send count update via WebSocket
      if (this.io) {
        const userRoom = `${ROOM_PREFIXES.USER}${userId}`;
        this.io.to(userRoom).emit(WS_SERVER_EVENTS.NOTIFICATION_COUNT_UPDATE, {
          userId,
          unreadCount: count,
        });
      }
    } catch (error) {
      logger.error('Failed to update unread count cache', { error, userId });
    }
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private static shouldSendNotification(type: NotificationType, preferences: any): boolean {
    switch (type) {
      case NotificationType.GAME_INVITATION:
        return preferences.game_invitations;
      case NotificationType.GAME_STARTED:
      case NotificationType.GAME_ENDED:
      case NotificationType.PLAYER_JOINED:
      case NotificationType.PLAYER_LEFT:
        return preferences.game_updates;
      case NotificationType.ACHIEVEMENT:
        return preferences.achievements;
      case NotificationType.SYSTEM:
        return preferences.system_announcements;
      default:
        return true;
    }
  }

  /**
   * Send notification when game starts
   */
  static async notifyGameStarted(gameId: string): Promise<void> {
    try {
      const game = await this.gameRepo.findById(gameId);
      if (!game) return;

      const participants = await this.gameRepo.getParticipants(gameId);

      const notifications: CreateNotificationDto[] = participants.map((p) => ({
        userId: p.user_id,
        type: NotificationType.GAME_STARTED,
        title: 'Game Started!',
        message: `The game "${game.name}" has started. Join now!`,
        data: {
          gameId: game.id,
          gameName: game.name,
          gameStatus: GAME_STATUS.IN_PROGRESS,
          actionUrl: `/game/${game.id}/play`,
        },
      }));

      await Promise.all(notifications.map((notif) => this.createNotification(notif)));
    } catch (error) {
      logger.error('Failed to notify game started', { error, gameId });
    }
  }

  /**
   * Send notification when game ends
   */
  static async notifyGameEnded(gameId: string, winnerId?: string): Promise<void> {
    try {
      const game = await this.gameRepo.findById(gameId);
      if (!game) return;

      const participants = await this.gameRepo.getParticipants(gameId);
      const winner = winnerId ? await this.userRepo.findById(winnerId) : null;

      const notifications: CreateNotificationDto[] = participants.map((p) => ({
        userId: p.user_id,
        type: NotificationType.GAME_ENDED,
        title: 'Game Ended',
        message: winner
          ? `${winner.name} won the game "${game.name}"!`
          : `The game "${game.name}" has ended.`,
        data: {
          gameId: game.id,
          gameName: game.name,
          gameStatus: GAME_STATUS.COMPLETED,
          winnerId: winnerId,
          winnerName: winner?.name,
          actionUrl: `/game/${game.id}/results`,
        },
      }));

      await Promise.all(notifications.map((notif) => this.createNotification(notif)));
    } catch (error) {
      logger.error('Failed to notify game ended', { error, gameId });
    }
  }
}
