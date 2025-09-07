import { NotificationType, NotificationStatus, NotificationData } from '@socket-game/shared';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  status: NotificationStatus;
  read_at?: Date;
  created_at: Date;
  expires_at?: Date;
}

export interface CreateNotificationDTO {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  expires_at?: Date;
}

export interface UpdateNotificationDTO {
  status?: NotificationStatus;
  read_at?: Date;
}

export interface NotificationPreferences {
  user_id: string;
  game_invitations: boolean;
  game_updates: boolean;
  achievements: boolean;
  system_announcements: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UpdateNotificationPreferencesDTO {
  game_invitations?: boolean;
  game_updates?: boolean;
  achievements?: boolean;
  system_announcements?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}