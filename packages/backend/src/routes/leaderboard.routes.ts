import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller';

const router = Router();

/**
 * GET /api/leaderboard
 * Get leaderboard based on query parameters
 * Query params:
 * - type: 'wins' | 'winRate' | 'weekly' | 'monthly' (default: 'wins')
 * - limit: number (default: 10, max: 50)
 */
router.get('/', LeaderboardController.getLeaderboard);

/**
 * GET /api/leaderboard/wins
 * Get top players by total wins
 * Query params:
 * - limit: number (default: 10, max: 50)
 */
router.get('/wins', LeaderboardController.getTopPlayersByWins);

/**
 * GET /api/leaderboard/win-rate
 * Get top players by win rate (minimum 5 games)
 * Query params:
 * - limit: number (default: 10, max: 50)
 */
router.get('/win-rate', LeaderboardController.getTopPlayersByWinRate);

/**
 * GET /api/leaderboard/weekly
 * Get current week's top players
 * Query params:
 * - limit: number (default: 10, max: 50)
 */
router.get('/weekly', LeaderboardController.getWeeklyLeaderboard);

/**
 * GET /api/leaderboard/monthly
 * Get current month's top players
 * Query params:
 * - limit: number (default: 10, max: 50)
 */
router.get('/monthly', LeaderboardController.getMonthlyLeaderboard);

export default router;