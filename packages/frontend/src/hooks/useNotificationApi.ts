import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNotificationStore } from '@/stores/notification.store';
import { gameSocket } from '@/lib/socket';
import type { Notification, NotificationPreferences } from '@socket-game/shared';

const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { unreadOnly?: boolean; type?: string }) =>
    [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

export function useNotificationApi() {
  const queryClient = useQueryClient();
  const { setNotifications, setUnreadCount, setPreferences, setLoading, setError } =
    useNotificationStore();

  // Fetch notifications
  const fetchNotifications = async (params?: { unreadOnly?: boolean; type?: string }) => {
    setLoading(true);
    try {
      const response = await api.get('/api/notifications', { params });
      const data = response.data;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
      return data;
    } catch (error: any) {
      setError(error.response?.data?.error?.message || 'Failed to fetch notifications');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to notifications via WebSocket
  const subscribeToNotifications = () => {
    gameSocket.subscribeToNotifications();
    return () => {
      gameSocket.unsubscribeFromNotifications();
    };
  };

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/api/notifications/mark-read/${notificationId}`);
      // Also emit WebSocket event
      gameSocket.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.post('/api/notifications/mark-all-read');
      // Also emit WebSocket event
      gameSocket.markAllNotificationsAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      useNotificationStore.getState().markAllAsRead();
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/api/notifications/${notificationId}`);
    },
    onSuccess: (_, notificationId) => {
      useNotificationStore.getState().removeNotification(notificationId);
    },
  });

  // Get preferences
  const { data: preferences } = useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: async () => {
      const response = await api.get('/api/notifications/preferences');
      const prefs = response.data;
      setPreferences(prefs);
      return prefs as NotificationPreferences;
    },
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const response = await api.put('/api/notifications/preferences', updates);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
      setPreferences(data);
      // Also emit WebSocket event
      gameSocket.updateNotificationPreferences(data);
    },
  });

  // Send game invitations
  const sendInvitations = useMutation({
    mutationFn: async ({ gameId, userIds }: { gameId: string; userIds: string[] }) => {
      const response = await api.post('/api/notifications/invite', { gameId, userIds });
      return response.data;
    },
  });

  return {
    fetchNotifications,
    subscribeToNotifications,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutateAsync,
    deleteNotification: deleteNotification.mutate,
    preferences,
    updatePreferences: updatePreferences.mutate,
    sendInvitations: sendInvitations.mutateAsync,
    isUpdatingPreferences: updatePreferences.isPending,
  };
}