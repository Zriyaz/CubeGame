import { Game, CreateGameDTO, UpdateGameDTO, GameStatus } from '../models/game.model';
import { GameParticipant, CreateGameParticipantDTO } from '../models/game-participant.model';
import { GameRepository } from '../repositories/game.repository';
import { GameParticipantRepository } from '../repositories/game-participant.repository';
import userRepository from '../repositories/user.repository';
import { getRedisClient } from '../config/redis';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { io } from '../index';
import { 
  PLAYER_COLORS, 
  GAME_CONFIG, 
  CACHE_KEYS,
  WS_SERVER_EVENTS,
  ERROR_CODES,
  HTTP_STATUS,
  GAME_STATUS
} from '@socket-game/shared';

export class GameService {
  private static gameRepository = new GameRepository();
  private static participantRepository = new GameParticipantRepository();
  private static readonly GAME_CACHE_PREFIX = CACHE_KEYS.GAME;
  private static readonly GAME_BOARD_PREFIX = CACHE_KEYS.GAME_BOARD;
  private static readonly CACHE_TTL = GAME_CONFIG.GAME_CACHE_TTL;

  /**
   * Create a new game
   */
  static async createGame(creatorId: string, data: { name: string; board_size: number; max_players?: number }): Promise<Game> {
    try {
      logger.info('Creating new game', { creatorId, ...data });

      // Validate board size
      if (data.board_size < GAME_CONFIG.MIN_BOARD_SIZE || data.board_size > GAME_CONFIG.MAX_BOARD_SIZE) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, `Board size must be between ${GAME_CONFIG.MIN_BOARD_SIZE} and ${GAME_CONFIG.MAX_BOARD_SIZE}`);
      }

      // Create the game
      const game = await this.gameRepository.create({
        creator_id: creatorId,
        name: data.name,
        board_size: data.board_size,
        max_players: data.max_players || GAME_CONFIG.DEFAULT_MAX_PLAYERS,
      });

      // Add creator as first participant with first color and mark as ready
      await this.participantRepository.create({
        game_id: game.id,
        user_id: creatorId,
        color: PLAYER_COLORS[0],
        is_ready: true, // Creator is always ready
      });

      // Initialize empty board in Redis
      const board = Array(data.board_size).fill(null).map(() => Array(data.board_size).fill(null));
      await getRedisClient().set(
        `${this.GAME_BOARD_PREFIX}${game.id}`,
        JSON.stringify(board),
        'EX',
        GAME_CONFIG.BOARD_CACHE_TTL
      );

      // Get the full game data with participants
      const gameWithDetails = await this.getGameById(game.id);

      logger.info('Game created successfully', { gameId: game.id });
      return gameWithDetails;
    } catch (error) {
      logger.error('Failed to create game', {
        creatorId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List games with filters
   */
  static async listGames(filters: {
    status?: GameStatus;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ games: any[]; total: number }> {
    try {
      logger.info('Listing games', filters);

      let games: Game[] = [];
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      if (filters.userId) {
        games = await this.gameRepository.findUserGames(filters.userId, filters.status);
      } else if (filters.status) {
        games = await this.gameRepository.findByStatus(filters.status, limit);
      } else {
        // Get all recent games
        games = await this.gameRepository.findByStatus(GAME_STATUS.WAITING, limit);
      }

      // Get detailed game info with participants
      const detailedGames = await Promise.all(
        games.slice(offset, offset + limit).map(async (game) => {
          const gameWithParticipants = await this.gameRepository.getGameWithParticipants(game.id);
          return {
            id: game.id,
            name: game.name,
            creatorName: gameWithParticipants?.participants?.[0]?.user?.name || 'Unknown',
            boardSize: game.board_size,
            playerCount: gameWithParticipants?.participants?.length || 0,
            maxPlayers: game.max_players,
            status: game.status,
            createdAt: game.created_at,
          };
        })
      );

      return {
        games: detailedGames,
        total: games.length,
      };
    } catch (error) {
      logger.error('Failed to list games', {
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get game details
   */
  static async getGameById(gameId: string): Promise<any> {
    try {
      logger.info('Getting game details', { gameId });

      // Try cache first
      const cached = await getRedisClient().get(`${this.GAME_CACHE_PREFIX}${gameId}`);
      if (cached) {
        const cachedGame = JSON.parse(cached);
        // Make sure cached game has all required fields
        if (cachedGame.players && cachedGame.creator) {
          const board = await this.getGameBoard(gameId);
          return { ...cachedGame, board };
        }
      }

      // Get from database
      const game = await this.gameRepository.getGameWithParticipants(gameId);
      if (!game) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Game not found');
      }
      
      logger.info('Game retrieved from database', { 
        gameId, 
        hasParticipants: !!game.participants,
        participantsCount: game.participants?.length || 0 
      });

      // Get creator info
      const creator = await userRepository.findById(game.creator_id);
      
      // Get board from Redis
      const board = await this.getGameBoard(gameId);

      const gameData = {
        id: game.id,
        creator_id: game.creator_id,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          avatarUrl: creator.avatar_url,
        } : null,
        boardSize: game.board_size,
        board_size: game.board_size,
        name: game.name,
        status: game.status,
        max_players: game.max_players,
        invite_code: game.invite_code,
        players: game.participants?.map((p: any) => ({
          userId: p.user_id,
          name: p.user.name,
          color: p.color,
          cellsOwned: p.cells_owned,
          isOnline: true, // TODO: Track real online status
          isReady: p.is_ready || false,
          avatarUrl: p.user.avatar_url,
        })) || [],
        board,
        created_at: game.created_at,
        startedAt: game.started_at,
        started_at: game.started_at,
        endedAt: game.ended_at,
        ended_at: game.ended_at,
      };

      // Cache the result
      await this.cacheGame(gameData);

      return gameData;
    } catch (error) {
      logger.error('Failed to get game details', {
        gameId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Join a game
   */
  static async joinGame(gameId: string, userId: string, data: { inviteCode?: string; color?: string }): Promise<any> {
    try {
      logger.info('User joining game', { gameId, userId, ...data });

      // Get game details
      const game = await this.gameRepository.findById(gameId);
      if (!game) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Game not found');
      }

      // Check if game is joinable
      if (game.status !== GAME_STATUS.WAITING) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Game is not accepting new players');
      }

      // Check invite code if provided
      if (data.inviteCode && game.invite_code !== data.inviteCode) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, 'Invalid invite code');
      }

      // Check if user is already in the game
      const existingParticipant = await this.participantRepository.findByGameAndUser(gameId, userId);
      if (existingParticipant) {
        // If user was in the game but left, reactivate them
        if (!existingParticipant.is_active) {
          await this.participantRepository.update(gameId, userId, {
            is_active: true,
            left_at: undefined,
          });
          
          // Clear cache
          await getRedisClient().del(`${this.GAME_CACHE_PREFIX}${gameId}`);
          
          // Get user info for broadcast
          const user = await userRepository.findById(userId);
          
          // Broadcast rejoin to other players
          io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.GAME_PLAYER_JOINED, {
            user: {
              id: user?.id,
              name: user?.name,
              avatarUrl: user?.avatar_url,
            },
            color: existingParticipant.color,
          });
          
          logger.info('User rejoined game successfully', { gameId, userId });
          
          // Return updated game
          return this.getGameById(gameId);
        } else {
          throw new AppError(HTTP_STATUS.CONFLICT, 'You are already in this game');
        }
      }

      // Check if game is full (only count active participants)
      const participants = await this.participantRepository.findActiveByGame(gameId);
      if (participants.length >= game.max_players) {
        throw new AppError(HTTP_STATUS.CONFLICT, 'Game is full');
      }

      // Assign color (use provided or pick next available)
      const usedColors = participants.map(p => p.color);
      const availableColors = PLAYER_COLORS.filter(c => !usedColors.includes(c));
      
      let assignedColor = data.color;
      if (!assignedColor || usedColors.includes(assignedColor)) {
        assignedColor = availableColors[0] || PLAYER_COLORS[participants.length % PLAYER_COLORS.length];
      }

      // Add participant
      await this.participantRepository.create({
        game_id: gameId,
        user_id: userId,
        color: assignedColor,
      });

      // Clear cache
      await getRedisClient().del(`${this.GAME_CACHE_PREFIX}${gameId}`);

      // Get user info for broadcast
      const user = await userRepository.findById(userId);

      // Broadcast to other players via WebSocket
      logger.info('Broadcasting player joined event', { 
        gameId, 
        userId, 
        eventName: WS_SERVER_EVENTS.GAME_PLAYER_JOINED,
        room: `game:${gameId}`
      });
      
      io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.GAME_PLAYER_JOINED, {
        user: {
          id: user?.id,
          name: user?.name,
          avatarUrl: user?.avatar_url,
        },
        color: assignedColor,
      });

      logger.info('User joined game successfully', { gameId, userId, color: assignedColor });

      // Get updated game with new player
      const gameWithDetails = await this.getGameById(gameId);
      return gameWithDetails;
    } catch (error) {
      logger.error('Failed to join game', {
        gameId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start a game
   */
  static async startGame(gameId: string, userId: string): Promise<any> {
    try {
      logger.info('Starting game', { gameId, userId });

      // Get game details
      const game = await this.gameRepository.findById(gameId);
      if (!game) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Game not found');
      }

      // Check if user is the creator
      if (game.creator_id !== userId) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, 'Only the game creator can start the game');
      }

      // Check if game is in waiting status
      if (game.status !== GAME_STATUS.WAITING) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Game has already started or ended');
      }

      // Check if there are enough players
      const participants = await this.participantRepository.findByGame(gameId);
      if (participants.length < GAME_CONFIG.MIN_PLAYERS) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, `Need at least ${GAME_CONFIG.MIN_PLAYERS} players to start the game`);
      }

      // Update game status
      const updatedGame = await this.gameRepository.update(gameId, {
        status: GAME_STATUS.IN_PROGRESS,
        started_at: new Date(),
      });

      // Clear cache
      await getRedisClient().del(`${this.GAME_CACHE_PREFIX}${gameId}`);

      // Broadcast to all players via WebSocket
      io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.GAME_STARTED, {
        gameId,
        startedAt: updatedGame?.started_at,
      });

      logger.info('Game started successfully', { gameId });

      return {
        gameId,
        status: GAME_STATUS.IN_PROGRESS,
        startedAt: updatedGame?.started_at,
      };
    } catch (error) {
      logger.error('Failed to start game', {
        gameId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Leave a game
   */
  static async leaveGame(gameId: string, userId: string): Promise<void> {
    try {
      logger.info('User leaving game', { gameId, userId });

      const participant = await this.participantRepository.findByGameAndUser(gameId, userId);
      if (!participant) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'You are not in this game');
      }

      await this.participantRepository.update(gameId, userId, {
        is_active: false,
        left_at: new Date(),
      });

      // Clear cache
      await getRedisClient().del(`${this.GAME_CACHE_PREFIX}${gameId}`);

      // Broadcast to other players
      io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.GAME_PLAYER_LEFT, {
        userId,
      });

      logger.info('User left game successfully', { gameId, userId });
    } catch (error) {
      logger.error('Failed to leave game', {
        gameId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get game board from Redis
   */
  private static async getGameBoard(gameId: string): Promise<(string | null)[][]> {
    const boardData = await getRedisClient().get(`${this.GAME_BOARD_PREFIX}${gameId}`);
    if (!boardData) {
      // Return empty board if not found
      const game = await this.gameRepository.findById(gameId);
      const size = game?.board_size || 8;
      return Array(size).fill(null).map(() => Array(size).fill(null));
    }
    return JSON.parse(boardData);
  }

  /**
   * Cache game data
   */
  private static async cacheGame(game: any): Promise<void> {
    await getRedisClient().set(
      `${this.GAME_CACHE_PREFIX}${game.id}`,
      JSON.stringify(game),
      'EX',
      this.CACHE_TTL
    );
  }

  /**
   * Find game by invite code
   */
  static async findByInviteCode(inviteCode: string): Promise<any> {
    try {
      const game = await this.gameRepository.findByInviteCode(inviteCode);
      if (!game) {
        return null;
      }

      const gameWithDetails = await this.getGameById(game.id);
      return gameWithDetails;
    } catch (error) {
      logger.error('Failed to find game by invite code', {
        inviteCode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Join game by invite code
   */
  static async joinByInviteCode(inviteCode: string, userId: string): Promise<any> {
    try {
      const game = await this.gameRepository.findByInviteCode(inviteCode);
      if (!game) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Game not found');
      }

      // Use existing joinGame method
      return await this.joinGame(game.id, userId, {});
    } catch (error) {
      logger.error('Failed to join game by invite code', {
        inviteCode,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}