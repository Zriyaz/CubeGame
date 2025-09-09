import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Notification, NotificationPreferences } from '@socket-game/shared';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;

  // Actions
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  toggleNotificationPanel: () => void;
  setPreferences: (preferences: NotificationPreferences) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isOpen: false,
      preferences: null,
      loading: false,
      error: null,

      // Actions
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.status === 'read' ? state.unreadCount : state.unreadCount + 1,
        }), false, 'addNotification'),

      removeNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && notification.status !== 'read';
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        }, false, 'removeNotification'),

      markAsRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.status === 'read') return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, status: 'read', readAt: new Date().toISOString() } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }, false, 'markAsRead'),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.status !== 'read' 
              ? { ...n, status: 'read', readAt: new Date().toISOString() } 
              : n
          ),
          unreadCount: 0,
        }), false, 'markAllAsRead'),

      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((n) => n.status !== 'read').length,
        }, false, 'setNotifications'),

      setUnreadCount: (count) =>
        set({ unreadCount: count }, false, 'setUnreadCount'),

      toggleNotificationPanel: () =>
        set((state) => ({ isOpen: !state.isOpen }), false, 'toggleNotificationPanel'),

      setPreferences: (preferences) =>
        set({ preferences }, false, 'setPreferences'),

      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
          error: null,
        }, false, 'clearAll'),

      setLoading: (loading) =>
        set({ loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),
    })),
    {
      name: 'notification-store',
    }
  )
);