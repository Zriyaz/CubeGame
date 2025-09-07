export enum NotificationType {
  GAME_INVITATION = 'game_invitation',
  GAME_STARTED = 'game_started',
  GAME_ENDED = 'game_ended',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  ACHIEVEMENT = 'achievement',
  SYSTEM = 'system',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  status: NotificationStatus;
  readAt?: Date | string;
  createdAt: Date | string;
  expiresAt?: Date | string;
}

export interface NotificationData {
  gameId?: string;
  inviterId?: string;
  inviterName?: string;
  inviterAvatar?: string;
  gameName?: string;
  gameStatus?: string;
  actionUrl?: string;
  [key: string]: any;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  expiresAt?: Date | string;
}

export interface NotificationPreferences {
  userId: string;
  gameInvitations: boolean;
  gameUpdates: boolean;
  achievements: boolean;
  systemAnnouncements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatedAt: Date | string;
}

// WebSocket notification events
export interface NotificationReceivedEvent {
  notification: Notification;
}

export interface NotificationReadEvent {
  notificationId: string;
  userId: string;
  readAt: Date | string;
}

export interface NotificationCountUpdateEvent {
  userId: string;
  unreadCount: number;
}

// API Request/Response types
export interface SendInviteRequest {
  gameId: string;
  userIds: string[];
}

export interface GetNotificationsRequest {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface MarkReadRequest {
  notificationIds: string[];
}

export interface UpdatePreferencesRequest {
  gameInvitations?: boolean;
  gameUpdates?: boolean;
  achievements?: boolean;
  systemAnnouncements?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}