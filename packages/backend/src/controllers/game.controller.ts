import { Request, Response, NextFunction } from 'express';
import { GameService } from '../services/game.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { GameStatus } from '../models/game.model';

export class GameController {
  /**
   * Create a new game
   */
  static async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { name, boardSize, maxPlayers } = req.body;

      logger.info('Create game request', {
        userId,
        name,
        boardSize,
        maxPlayers,
      });

      // Validate input
      if (!name || !boardSize) {
        throw new AppError(400, 'Name and board size are required');
      }

      const game = await GameService.createGame(userId, {
        name,
        board_size: boardSize,
        max_players: maxPlayers,
      });

      logger.info('Game created successfully', {
        gameId: game.id,
        creatorId: userId,
      });

      res.status(201).json(game);
    } catch (error) {
      logger.error('Failed to create game', {
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * List games
   */
  static async list(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, limit, offset } = req.query;
      const userId = req.userId;

      logger.info('List games request', {
        userId,
        status,
        limit,
        offset,
      });

      const result = await GameService.listGames({
        status: status as GameStatus,
        userId: req.query.myGames === 'true' ? userId : undefined,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.json({
        games: result.games,
        total: result.total,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });
    } catch (error) {
      logger.error('Failed to list games', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Get game details
   */
  static async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId } = req.params;

      logger.info('Get game details request', { gameId });

      const game = await GameService.getGameById(gameId);

      res.json(game);
    } catch (error) {
      logger.error('Failed to get game details', {
        gameId: req.params.gameId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Join a game
   */
  static async join(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { gameId } = req.params;
      const { inviteCode, color } = req.body;

      logger.info('Join game request', {
        userId,
        gameId,
        inviteCode: !!inviteCode,
        color,
      });

      const result = await GameService.joinGame(gameId, userId, {
        inviteCode,
        color,
      });

      logger.info('User joined game successfully', {
        gameId,
        userId,
        color: result.assignedColor,
      });

      res.json(result);
    } catch (error) {
      logger.error('Failed to join game', {
        gameId: req.params.gameId,
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Start a game
   */
  static async start(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { gameId } = req.params;

      logger.info('Start game request', {
        userId,
        gameId,
      });

      const result = await GameService.startGame(gameId, userId);

      logger.info('Game started successfully', {
        gameId,
      });

      res.json(result);
    } catch (error) {
      logger.error('Failed to start game', {
        gameId: req.params.gameId,
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Leave a game
   */
  static async leave(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { gameId } = req.params;

      logger.info('Leave game request', {
        userId,
        gameId,
      });

      await GameService.leaveGame(gameId, userId);

      logger.info('User left game successfully', {
        gameId,
        userId,
      });

      res.json({ message: 'Successfully left the game' });
    } catch (error) {
      logger.error('Failed to leave game', {
        gameId: req.params.gameId,
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Find game by invite code
   */
  static async findByInviteCode(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { inviteCode } = req.params;

      logger.info('Find game by invite code request', {
        inviteCode,
        userId: req.userId,
      });

      const game = await GameService.findByInviteCode(inviteCode);

      if (!game) {
        throw new AppError(404, 'Game not found');
      }

      res.json(game);
    } catch (error) {
      logger.error('Failed to find game by invite code', {
        inviteCode: req.params.inviteCode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }

  /**
   * Join game by invite code
   */
  static async joinByCode(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const { inviteCode } = req.body;

      if (!inviteCode) {
        throw new AppError(400, 'Invite code is required');
      }

      logger.info('Join game by code request', {
        userId,
        inviteCode,
      });

      const game = await GameService.joinByInviteCode(inviteCode, userId);

      logger.info('User joined game by code successfully', {
        gameId: game.id,
        userId,
        inviteCode,
      });

      res.json(game);
    } catch (error) {
      logger.error('Failed to join game by code', {
        inviteCode: req.body.inviteCode,
        userId: req.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
}