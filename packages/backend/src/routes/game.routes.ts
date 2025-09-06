import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All game routes require authentication
router.use(authenticate);

// Create a new game
router.post('/', GameController.create);

// List games
router.get('/', GameController.list);

// Find game by invite code
router.get('/invite/:inviteCode', GameController.findByInviteCode);

// Get game details
router.get('/:gameId', GameController.getById);

// Join a game
router.post('/:gameId/join', GameController.join);

// Join a game by invite code
router.post('/join-by-code', GameController.joinByCode);

// Start a game
router.post('/:gameId/start', GameController.start);

// Leave a game
router.post('/:gameId/leave', GameController.leave);

export default router;