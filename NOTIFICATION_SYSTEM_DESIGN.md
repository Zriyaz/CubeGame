# CubeGame Notification System Design

## Overview

This document outlines the design and implementation plan for a scalable, modular notification system for the CubeGame application. The system will handle game invitations and other real-time notifications.

## Requirements

### Functional Requirements

1. **Game Invitations**
   - Only game hosts can invite players
   - Invitations can only be sent before game starts (in "waiting" status)
   - Recipients receive real-time notifications
   - Clicking notification redirects to appropriate game state:
     - If game is waiting → Game room page
     - If game has started → Active game page
     - If game has ended → Results page

2. **Notification Types**
   - Game invitations
   - Game started notifications
   - Player joined/left notifications
   - Game results
   - System announcements

3. **Delivery Methods**
   - Real-time via WebSocket (for online users)
   - Persistent storage for offline users
   - Email notifications (optional, future)

### Non-Functional Requirements

1. **Scalability**
   - Support thousands of concurrent users
   - Efficient message delivery
   - Minimal latency

2. **Modularity**
   - Easy to add new notification types
   - Pluggable delivery channels
   - Clean separation of concerns

3. **Reliability**
   - Message persistence
   - Delivery confirmation
   - Retry mechanism

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
├─────────────────────────────────────────────────────────────────┤
│ NotificationProvider │ NotificationUI │ NotificationStore       │
└───────────┬─────────┴───────────┬────┴──────────────────────────┘
            │                     │
            │ WebSocket           │ HTTP API
            │                     │
┌───────────▼─────────────────────▼───────────────────────────────┐
│                          Backend                                 │
├─────────────────────────────────────────────────────────────────┤
│ NotificationService │ NotificationController │ WebSocket Handler│
├─────────────────────┴────────────┬──────────┴──────────────────┤
│ NotificationQueue               │ NotificationRepository        │
└─────────────────────────────────┴──────────────────────────────┘
            │                                │
┌───────────▼────────────┐      ┌───────────▼────────────┐
│      Redis Queue       │      │     PostgreSQL DB       │
└────────────────────────┘      └─────────────────────────┘
```

### Database Schema

```sql
-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'game_invitation',
  'game_started',
  'game_ended',
  'player_joined',
  'player_left',
  'achievement',
  'system'
);

-- Notification status enum
CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'read',
  'failed'
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (gameId, inviterId, etc.)
  status notification_status DEFAULT 'pending',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_status (status),
  INDEX idx_notifications_created_at (created_at DESC)
);

-- Notification preferences table
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  game_invitations BOOLEAN DEFAULT true,
  game_updates BOOLEAN DEFAULT true,
  achievements BOOLEAN DEFAULT true,
  system_announcements BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Plan

### Phase 1: Backend Infrastructure

#### 1. Notification Models and Types

```typescript
// packages/shared/src/types/notification.types.ts
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
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationData {
  gameId?: string;
  inviterId?: string;
  inviterName?: string;
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
  expiresAt?: Date;
}
```

#### 2. Notification Service

```typescript
// packages/backend/src/services/notification.service.ts
export class NotificationService {
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // Create notification in database
    // Queue for delivery
    // Return created notification
  }

  async sendGameInvitation(
    gameId: string,
    inviterId: string,
    recipientIds: string[]
  ): Promise<void> {
    // Validate game status
    // Create notifications for each recipient
    // Send via WebSocket if online
    // Store in DB for persistence
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Update notification status
    // Emit read receipt via WebSocket
  }

  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<{ notifications: Notification[]; total: number }> {
    // Fetch notifications from DB
    // Apply filters and pagination
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // Soft delete or mark as deleted
  }
}
```

#### 3. WebSocket Events

```typescript
// Add to packages/shared/constants.ts
export const WS_CLIENT_EVENTS = {
  ...existing,
  // Notifications
  NOTIFICATION_SEND_INVITE: 'notification:send_invite',
  NOTIFICATION_MARK_READ: 'notification:mark_read',
  NOTIFICATION_MARK_ALL_READ: 'notification:mark_all_read',
  NOTIFICATION_DELETE: 'notification:delete',
};

export const WS_SERVER_EVENTS = {
  ...existing,
  // Notifications
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DELETED: 'notification:deleted',
  NOTIFICATION_COUNT_UPDATE: 'notification:count_update',
};
```

### Phase 2: Frontend Implementation

#### 1. Notification Context and Provider

```typescript
// packages/frontend/src/contexts/NotificationContext.tsx
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  sendGameInvitation: (gameId: string, userIds: string[]) => Promise<void>;
}

export const NotificationProvider: React.FC = ({ children }) => {
  // Subscribe to WebSocket events
  // Manage notification state
  // Provide notification methods
};
```

#### 2. Notification UI Components

```typescript
// packages/frontend/src/components/notifications/NotificationBell.tsx
export const NotificationBell: React.FC = () => {
  // Show notification count badge
  // Open notification dropdown on click
  // Play sound for new notifications
};

// packages/frontend/src/components/notifications/NotificationList.tsx
export const NotificationList: React.FC = () => {
  // Display notifications
  // Handle click actions
  // Show loading/empty states
};

// packages/frontend/src/components/notifications/NotificationItem.tsx
export const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  // Render notification based on type
  // Handle click to navigate
  // Show read/unread state
};

// packages/frontend/src/components/notifications/GameInviteModal.tsx
export const GameInviteModal: React.FC<{ gameId: string; onClose: () => void }> = ({ gameId, onClose }) => {
  // Show list of online users
  // Allow multi-select
  // Send invitations
};
```

#### 3. Notification Store

```typescript
// packages/frontend/src/stores/notification.store.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  lastFetch: number | null;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>(...);
```

### Phase 3: Integration

#### 1. Game Room Integration

```typescript
// Update GameRoomPage.tsx
const GameRoomPage = () => {
  const { sendGameInvitation } = useNotifications();
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const handleInviteClick = () => {
    if (isHost) {
      setShowInviteModal(true);
    }
  };
  
  // Add Invite button for host
  // Show GameInviteModal when clicked
};
```

#### 2. Header Integration

```typescript
// Update Header.tsx
const Header = () => {
  // Add NotificationBell component
  // Show notification dropdown
  // Update notification count in real-time
};
```

## API Endpoints

### Notification Endpoints

```typescript
// GET /api/notifications
// Get user notifications with pagination

// POST /api/notifications/mark-read/:id
// Mark notification as read

// POST /api/notifications/mark-all-read
// Mark all notifications as read

// DELETE /api/notifications/:id
// Delete a notification

// GET /api/notifications/preferences
// Get user notification preferences

// PUT /api/notifications/preferences
// Update user notification preferences
```

## WebSocket Flow

### Sending Game Invitation

```
Client                     Server                      Database
  │                          │                            │
  ├──SEND_INVITE────────────>│                            │
  │  {gameId, userIds}       │                            │
  │                          ├──Validate game status────>│
  │                          │<─────Game details─────────│
  │                          │                            │
  │                          ├──Create notifications────>│
  │                          │<────Notification IDs──────│
  │                          │                            │
  │<──INVITE_SENT────────────│                            │
  │                          │                            │
  │                          ├──Send to recipients───┐   │
  │                          │  (if online)          │   │
  │                          │                       │   │
  │                          │<──────────────────────┘   │
  │                          │                            │

Recipient (if online)        │                            │
  │<──NOTIFICATION_RECEIVED──│                            │
  │   {notification}         │                            │
```

### Notification Click Flow

```
1. User clicks notification
2. Extract actionUrl or gameId from notification data
3. Check game status:
   - If waiting → Navigate to /game/:gameId/room
   - If in_progress → Navigate to /game/:gameId/play
   - If completed → Navigate to /game/:gameId/results
4. Mark notification as read
```

## Security Considerations

1. **Authorization**
   - Only game hosts can send invitations
   - Users can only access their own notifications
   - Rate limiting on invitation sending

2. **Validation**
   - Validate game exists and is in waiting status
   - Validate recipient users exist
   - Prevent duplicate invitations

3. **Privacy**
   - Don't expose user online status publicly
   - Allow users to disable notifications

## Performance Considerations

1. **Caching**
   - Cache notification counts in Redis
   - Cache user preferences
   - Debounce notification updates

2. **Batching**
   - Batch multiple notifications for same user
   - Aggregate notification counts

3. **Pagination**
   - Limit notification list size
   - Implement cursor-based pagination

## Future Enhancements

1. **Email Notifications**
   - Send email for important notifications
   - Daily/weekly digest emails

2. **Push Notifications**
   - Browser push notifications
   - Mobile app push notifications

3. **Notification Templates**
   - Customizable notification messages
   - Multi-language support

4. **Advanced Features**
   - Notification grouping
   - Notification actions (Accept/Decline)
   - Notification scheduling
   - Do not disturb mode

## Testing Strategy

1. **Unit Tests**
   - NotificationService methods
   - WebSocket handlers
   - Frontend components

2. **Integration Tests**
   - API endpoints
   - WebSocket flows
   - Database operations

3. **E2E Tests**
   - Complete invitation flow
   - Notification delivery
   - Click-through actions

## Monitoring

1. **Metrics**
   - Notification delivery rate
   - Read rate
   - Click-through rate
   - WebSocket connection count

2. **Logging**
   - Notification creation
   - Delivery attempts
   - Errors and failures

3. **Alerts**
   - High failure rate
   - Queue backlog
   - Database errors