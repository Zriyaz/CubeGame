import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { userValidators } from '../validators/user.validators';
import { logger } from '../utils/logger';

const router = Router();

// Log all user route requests
router.use((req, res, next) => {
  logger.info('User route accessed', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Get current user profile with stats
router.get('/profile', authenticate, UserController.getCurrentUserProfile);

// Update current user profile
router.patch(
  '/profile',
  authenticate,
  userValidators.updateProfile,
  UserController.updateProfile
);

// Search users
router.get(
  '/search',
  optionalAuth,
  userValidators.searchUsers,
  UserController.searchUsers
);

// Get active users
router.get(
  '/active',
  UserController.getActiveUsers
);

// Get online users (authenticated only)
router.get(
  '/online',
  authenticate,
  UserController.getOnlineUsers
);

// Get specific user profile (public)
router.get(
  '/:userId',
  userValidators.getUserProfile,
  UserController.getUserProfile
);

// Get user statistics (public)
router.get(
  '/:userId/stats',
  userValidators.getUserStats,
  UserController.getUserStats
);

export default router;