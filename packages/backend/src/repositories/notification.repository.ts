import { getPool } from '../config/database';
import { 
  Notification, 
  CreateNotificationDTO, 
  UpdateNotificationDTO,
  NotificationPreferences,
  UpdateNotificationPreferencesDTO 
} from '../models/notification.model';
import { NotificationType, NotificationStatus } from '@socket-game/shared';
import { logger } from '../utils/logger';

export class NotificationRepository {
  private get pool() {
    return getPool();
  }

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationDTO): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.type,
      data.title,
      data.message,
      JSON.stringify(data.data || {}),
      data.expires_at,
    ];

    try {
      const result = await this.pool.query(query, values);
      return this.mapToNotification(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create notification', { error, data });
      throw error;
    }
  }

  /**
   * Create multiple notifications
   */
  async createMany(notifications: CreateNotificationDTO[]): Promise<Notification[]> {
    if (notifications.length === 0) return [];

    const values: any[] = [];
    const placeholders: string[] = [];
    
    notifications.forEach((notif, index) => {
      const offset = index * 6;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
      );
      values.push(
        notif.user_id,
        notif.type,
        notif.title,
        notif.message,
        JSON.stringify(notif.data || {}),
        notif.expires_at
      );
    });

    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, expires_at)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.map((row: any) => this.mapToNotification(row));
    } catch (error) {
      logger.error('Failed to create multiple notifications', { error });
      throw error;
    }
  }

  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<Notification | null> {
    const query = 'SELECT * FROM notifications WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] ? this.mapToNotification(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find notification by ID', { error, id });
      throw error;
    }
  }

  /**
   * Find notifications for a user
   */
  async findByUser(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { limit = 20, offset = 0, unreadOnly = false, type } = options;
    
    let whereClause = 'WHERE user_id = $1';
    const values: any[] = [userId];
    let valueIndex = 2;

    if (unreadOnly) {
      whereClause += ` AND status IN ('pending', 'sent')`;
    }

    if (type) {
      whereClause += ` AND type = $${valueIndex}`;
      values.push(type);
      valueIndex++;
    }

    whereClause += ` AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM notifications ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    values.push(limit, offset);
    const query = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;

    try {
      const result = await this.pool.query(query, values);
      const notifications = result.rows.map((row: any) => this.mapToNotification(row));
      return { notifications, total };
    } catch (error) {
      logger.error('Failed to find notifications for user', { error, userId, options });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const query = `SELECT get_unread_notification_count($1) as count`;

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to get unread notification count', { error, userId });
      throw error;
    }
  }

  /**
   * Update notification
   */
  async update(id: string, data: UpdateNotificationDTO): Promise<Notification | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${valueIndex}`);
      values.push(data.status);
      valueIndex++;
    }

    if (data.read_at !== undefined) {
      fields.push(`read_at = $${valueIndex}`);
      values.push(data.read_at);
      valueIndex++;
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE notifications
      SET ${fields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0] ? this.mapToNotification(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to update notification', { error, id, data });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE notifications
      SET status = $1, read_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3 AND status != 'read'
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [NotificationStatus.READ, id, userId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, id, userId });
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(ids: string[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;

    const query = `
      UPDATE notifications
      SET status = $1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND id = ANY($3) AND status != 'read'
    `;

    try {
      const result = await this.pool.query(query, [NotificationStatus.READ, userId, ids]);
      return result.rowCount ?? 0;
    } catch (error) {
      logger.error('Failed to mark notifications as read', { error, ids, userId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET status = $1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND status IN ('pending', 'sent')
    `;

    try {
      const result = await this.pool.query(query, [NotificationStatus.READ, userId]);
      return result.rowCount ?? 0;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM notifications WHERE id = $1 AND user_id = $2';

    try {
      const result = await this.pool.query(query, [id, userId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Failed to delete notification', { error, id, userId });
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpired(): Promise<number> {
    const query = 'SELECT cleanup_expired_notifications() as count';

    try {
      const result = await this.pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to cleanup expired notifications', { error });
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const query = 'SELECT * FROM notification_preferences WHERE user_id = $1';

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string, 
    data: UpdateNotificationPreferencesDTO
  ): Promise<NotificationPreferences> {
    const fields: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    // Filter out user_id from data since it's handled separately
    const { user_id, ...updateData } = data as any;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
      }
    });

    if (fields.length === 0) {
      const existing = await this.getPreferences(userId);
      if (!existing) {
        // Create default preferences
        return this.createDefaultPreferences(userId);
      }
      return existing;
    }

    values.push(userId);
    const query = `
      INSERT INTO notification_preferences (user_id, ${Object.keys(updateData).join(', ')})
      VALUES ($${valueIndex}, ${Object.keys(updateData).map((_, i) => `$${i + 1}`).join(', ')})
      ON CONFLICT (user_id) DO UPDATE SET
      ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update notification preferences', { error, userId, data });
      throw error;
    }
  }

  /**
   * Create default notification preferences
   */
  private async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const query = `
      INSERT INTO notification_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create default notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Map database row to notification model
   */
  private mapToNotification(row: any): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      status: row.status,
      read_at: row.read_at,
      created_at: row.created_at,
      expires_at: row.expires_at,
    };
  }
}