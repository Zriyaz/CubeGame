import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, query } from 'express-validator';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get notifications
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('unreadOnly').optional().isBoolean().toBoolean(),
    query('type').optional().isString(),
  ],
  validateRequest,
  NotificationController.getNotifications
);

// Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// Send game invitations
router.post(
  '/invite',
  [
    body('gameId').isUUID().withMessage('Valid gameId is required'),
    body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
    body('userIds.*').isUUID().withMessage('Each userId must be a valid UUID'),
  ],
  validateRequest,
  NotificationController.sendInvitations
);

// Mark notifications as read (multiple)
router.post(
  '/mark-read',
  [
    body('notificationIds').isArray({ min: 1 }).withMessage('notificationIds must be a non-empty array'),
    body('notificationIds.*').isUUID().withMessage('Each notificationId must be a valid UUID'),
  ],
  validateRequest,
  NotificationController.markAsRead
);

// Mark single notification as read
router.post('/mark-read/:id', NotificationController.markOneAsRead);

// Mark all notifications as read
router.post('/mark-all-read', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

// Get notification preferences
router.get('/preferences', NotificationController.getPreferences);

// Update notification preferences
router.put(
  '/preferences',
  [
    body('gameInvitations').optional().isBoolean(),
    body('gameUpdates').optional().isBoolean(),
    body('achievements').optional().isBoolean(),
    body('systemAnnouncements').optional().isBoolean(),
    body('emailNotifications').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
  ],
  validateRequest,
  NotificationController.updatePreferences
);

export default router;