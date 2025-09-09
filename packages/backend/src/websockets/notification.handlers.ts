import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth.middleware';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/logger';
import {
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
  ERROR_CODES,
  ROOM_PREFIXES
} from '@socket-game/shared';

export const setupNotificationHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const notificationService = new NotificationService(io);

  // Subscribe to user notifications
  socket.on(WS_CLIENT_EVENTS.NOTIFICATION_SUBSCRIBE, async () => {
    try {
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      // Join user-specific notification room
      const userRoom = `${ROOM_PREFIXES.USER}${userId}`;
      socket.join(userRoom);

      logger.info('User subscribed to notifications', {
        socketId: socket.id,
        userId,
        room: userRoom,
        rooms: Array.from(socket.rooms),
      });

      // Send initial unread count
      const unreadCount = await notificationService.getUnreadCount(userId);
      socket.emit(WS_SERVER_EVENTS.NOTIFICATION_COUNT, { count: unreadCount });

      // Send recent unread notifications
      const unreadNotifications = await notificationService.getUnreadNotifications(userId);
      if (unreadNotifications.length > 0) {
        socket.emit(WS_SERVER_EVENTS.NOTIFICATION_BATCH, { 
          notifications: unreadNotifications 
        });
      }

    } catch (error) {
      logger.error('Failed to subscribe to notifications', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to subscribe to notifications',
      });
    }
  });

  // Unsubscribe from user notifications
  socket.on(WS_CLIENT_EVENTS.NOTIFICATION_UNSUBSCRIBE, () => {
    try {
      const userId = socket.userId;

      if (!userId) {
        return;
      }

      const userRoom = `${ROOM_PREFIXES.USER}${userId}`;
      socket.leave(userRoom);

      logger.info('User unsubscribed from notifications', {
        socketId: socket.id,
        userId,
      });
    } catch (error) {
      logger.error('Failed to unsubscribe from notifications', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Mark notification as read via WebSocket
  socket.on(WS_CLIENT_EVENTS.NOTIFICATION_MARK_READ, async (data: { notificationId: string }) => {
    try {
      const userId = socket.userId;
      const { notificationId } = data;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      await notificationService.markAsRead(userId, [notificationId]);

      // Emit updated unread count
      const unreadCount = await notificationService.getUnreadCount(userId);
      socket.emit(WS_SERVER_EVENTS.NOTIFICATION_COUNT, { count: unreadCount });

      logger.info('Notification marked as read via WebSocket', {
        userId,
        notificationId,
      });
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to mark notification as read',
      });
    }
  });

  // Mark all notifications as read via WebSocket
  socket.on(WS_CLIENT_EVENTS.NOTIFICATION_MARK_ALL_READ, async () => {
    try {
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      await notificationService.markAllAsRead(userId);

      // Emit updated unread count (should be 0)
      socket.emit(WS_SERVER_EVENTS.NOTIFICATION_COUNT, { count: 0 });

      logger.info('All notifications marked as read via WebSocket', {
        userId,
      });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to mark all notifications as read',
      });
    }
  });

  // Handle game invitation sending via WebSocket (alternative to HTTP)
  socket.on(WS_CLIENT_EVENTS.GAME_INVITE, async (data: { gameId: string; userIds: string[] }) => {
    try {
      const hostId = socket.userId;
      const { gameId, userIds } = data;

      if (!hostId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      // Use notification service to send invitations
      const results = await notificationService.sendGameInvitations(gameId, hostId, userIds);

      // Send success response
      socket.emit(WS_SERVER_EVENTS.GAME_INVITE_SENT, {
        gameId,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      });

      logger.info('Game invitations sent via WebSocket', {
        hostId,
        gameId,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });
    } catch (error) {
      logger.error('Failed to send game invitations', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to send game invitations',
      });
    }
  });

  // Handle notification preferences update via WebSocket
  socket.on(WS_CLIENT_EVENTS.NOTIFICATION_UPDATE_PREFERENCES, async (data: any) => {
    try {
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      const updatedPreferences = await notificationService.updatePreferences(userId, data);

      socket.emit(WS_SERVER_EVENTS.NOTIFICATION_PREFERENCES_UPDATED, {
        preferences: updatedPreferences,
      });

      logger.info('Notification preferences updated via WebSocket', {
        userId,
        updates: Object.keys(data),
      });
    } catch (error) {
      logger.error('Failed to update notification preferences', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to update notification preferences',
      });
    }
  });
};