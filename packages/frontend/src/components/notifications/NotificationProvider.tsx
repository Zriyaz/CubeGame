import { useEffect, type ReactNode } from 'react';
import { useNotificationStore } from '@/stores/notification.store';
import { gameSocket } from '@/lib/socket';
import { soundManager } from '@/utils/sound/soundManager';
import { useNotificationApi } from '@/hooks/useNotificationApi';
import { WS_SERVER_EVENTS, type Notification, type NotificationType } from '@socket-game/shared';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { 
    addNotification, 
    setUnreadCount, 
    setNotifications,
    markAsRead 
  } = useNotificationStore();
  
  const { fetchNotifications, subscribeToNotifications } = useNotificationApi();

  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications();

    // Subscribe to WebSocket notifications
    const unsubscribe = subscribeToNotifications();

    // Set up WebSocket event handlers
    const handleNotificationReceived = (data: { notification: Notification }) => {
      addNotification(data.notification);
      
      // Play sound based on notification type
      if (data.notification.type === 'game_invitation') {
        soundManager.play('invitation');
      } else {
        soundManager.play('notification');
      }

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/icon-192x192.png',
          tag: data.notification.id,
        });
      }
    };

    const handleNotificationCount = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    const handleNotificationBatch = (data: { notifications: Notification[] }) => {
      data.notifications.forEach((notification) => {
        addNotification(notification);
      });
    };

    const handleNotificationRead = (data: { notificationId: string; readAt: string }) => {
      markAsRead(data.notificationId);
    };

    const handleNotificationDeleted = (data: { notificationId: string }) => {
      useNotificationStore.getState().removeNotification(data.notificationId);
    };

    // Register event listeners
    gameSocket.addSocketListener(WS_SERVER_EVENTS.NOTIFICATION_RECEIVED, handleNotificationReceived);
    gameSocket.addSocketListener(WS_SERVER_EVENTS.NOTIFICATION_COUNT, handleNotificationCount);
    gameSocket.addSocketListener(WS_SERVER_EVENTS.NOTIFICATION_BATCH, handleNotificationBatch);
    gameSocket.addSocketListener(WS_SERVER_EVENTS.NOTIFICATION_READ, handleNotificationRead);
    gameSocket.addSocketListener(WS_SERVER_EVENTS.NOTIFICATION_DELETED, handleNotificationDeleted);

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      // Cleanup event listeners
      gameSocket.removeSocketListener(WS_SERVER_EVENTS.NOTIFICATION_RECEIVED, handleNotificationReceived);
      gameSocket.removeSocketListener(WS_SERVER_EVENTS.NOTIFICATION_COUNT, handleNotificationCount);
      gameSocket.removeSocketListener(WS_SERVER_EVENTS.NOTIFICATION_BATCH, handleNotificationBatch);
      gameSocket.removeSocketListener(WS_SERVER_EVENTS.NOTIFICATION_READ, handleNotificationRead);
      gameSocket.removeSocketListener(WS_SERVER_EVENTS.NOTIFICATION_DELETED, handleNotificationDeleted);
      
      unsubscribe?.();
    };
  }, []);

  return <>{children}</>;
}