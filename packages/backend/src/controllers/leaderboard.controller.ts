import { Request, Response, NextFunction } from 'express';
import { LeaderboardService, LeaderboardType } from '../services/leaderboard.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class LeaderboardController {
  /**
   * Get leaderboard based on type and query parameters
   */
  static async getLeaderboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { type, limit } = req.query;

      // Validate type parameter
      const validTypes: LeaderboardType[] = ['wins', 'winRate', 'weekly', 'monthly'];
      const leaderboardType = (type as string) || 'wins';
      
      if (!validTypes.includes(leaderboardType as LeaderboardType)) {
        throw new AppError(400, `Invalid type parameter. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate and parse limit parameter
      let parsedLimit = 10; // default
      if (limit) {
        parsedLimit = parseInt(limit as string);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          throw new AppError(400, 'Limit must be a positive number');
        }
        if (parsedLimit > 50) {
          throw new AppError(400, 'Limit cannot exceed 50');
        }
      }

      logger.info('Leaderboard request', {
        type: leaderboardType,
        limit: parsedLimit,
      });

      const leaderboard = await LeaderboardService.getLeaderboard(
        leaderboardType as LeaderboardType,
        parsedLimit
      );

      res.json(leaderboard);
    } catch (error) {
      logger.error('Failed to get leaderboard', {
        type: req.query.type,
        limit: req.query.limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get top players by total wins
   */
  static async getTopPlayersByWins(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit } = req.query;
      let parsedLimit = 10;

      if (limit) {
        parsedLimit = parseInt(limit as string);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
          throw new AppError(400, 'Limit must be a number between 1 and 50');
        }
      }

      logger.info('Top players by wins request', { limit: parsedLimit });

      const entries = await LeaderboardService.getTopPlayersByWins(parsedLimit);

      res.json({
        entries,
        total: entries.length,
        limit: parsedLimit,
        type: 'wins'
      });
    } catch (error) {
      logger.error('Failed to get top players by wins', {
        limit: req.query.limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get top players by win rate
   */
  static async getTopPlayersByWinRate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit } = req.query;
      let parsedLimit = 10;

      if (limit) {
        parsedLimit = parseInt(limit as string);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
          throw new AppError(400, 'Limit must be a number between 1 and 50');
        }
      }

      logger.info('Top players by win rate request', { limit: parsedLimit });

      const entries = await LeaderboardService.getTopPlayersByWinRate(parsedLimit);

      res.json({
        entries,
        total: entries.length,
        limit: parsedLimit,
        type: 'winRate'
      });
    } catch (error) {
      logger.error('Failed to get top players by win rate', {
        limit: req.query.limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get weekly leaderboard
   */
  static async getWeeklyLeaderboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit } = req.query;
      let parsedLimit = 10;

      if (limit) {
        parsedLimit = parseInt(limit as string);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
          throw new AppError(400, 'Limit must be a number between 1 and 50');
        }
      }

      logger.info('Weekly leaderboard request', { limit: parsedLimit });

      const entries = await LeaderboardService.getTopPlayersThisWeek(parsedLimit);

      res.json({
        entries,
        total: entries.length,
        limit: parsedLimit,
        type: 'weekly'
      });
    } catch (error) {
      logger.error('Failed to get weekly leaderboard', {
        limit: req.query.limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get monthly leaderboard
   */
  static async getMonthlyLeaderboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit } = req.query;
      let parsedLimit = 10;

      if (limit) {
        parsedLimit = parseInt(limit as string);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
          throw new AppError(400, 'Limit must be a number between 1 and 50');
        }
      }

      logger.info('Monthly leaderboard request', { limit: parsedLimit });

      const entries = await LeaderboardService.getTopPlayersThisMonth(parsedLimit);

      res.json({
        entries,
        total: entries.length,
        limit: parsedLimit,
        type: 'monthly'
      });
    } catch (error) {
      logger.error('Failed to get monthly leaderboard', {
        limit: req.query.limit,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
}