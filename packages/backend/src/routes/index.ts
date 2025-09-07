import { Router } from 'express';
import authRoutes from './auth.routes';
import gameRoutes from './game.routes';
import userRoutes from './user.routes';
import leaderboardRoutes from './leaderboard.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/users', userRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;