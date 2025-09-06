import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authValidators } from '../validators/auth.validators';
import { logger } from '../utils/logger';

const router = Router();

// Log all auth route requests
router.use((req, res, next) => {
  logger.info('Auth route accessed', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Google OAuth routes
router.get(
  '/google',
  (req, res, next) => {
    logger.info('Google OAuth initiated', { ip: req.ip });
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  (req, res, next) => {
    logger.info('Google OAuth callback received', { 
      ip: req.ip,
      query: req.query,
    });
    next();
  },
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/failure' }),
  AuthController.googleCallback
);

// Token refresh endpoint
router.post('/refresh', authValidators.refreshToken, AuthController.refreshToken);

// Logout endpoint
router.post('/logout', authenticate, AuthController.logout);

// Get current user endpoint
router.get('/me', authenticate, AuthController.getCurrentUser);

// Get WebSocket token endpoint
router.get('/ws-token', authenticate, AuthController.getWebSocketToken);

// Authentication failure redirect
router.get('/failure', AuthController.authFailure);

export default router;