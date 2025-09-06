import { Server } from 'socket.io';
import { AuthenticatedSocket } from './auth.middleware';
import { GameService } from '../services/game.service';
import { GameRepository } from '../repositories/game.repository';
import { GameParticipantRepository } from '../repositories/game-participant.repository';
import { MoveRepository } from '../repositories/move.repository';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { GameStatus } from '../models/game.model';
import {
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
  ERROR_CODES,
  GAME_STATUS,
  CACHE_KEYS,
  GAME_CONFIG
} from '@socket-game/shared';

const gameRepository = new GameRepository();
const participantRepository = new GameParticipantRepository();
const moveRepository = new MoveRepository();
const GAME_BOARD_PREFIX = CACHE_KEYS.GAME_BOARD;

export const setupGameHandlers = (io: Server, socket: AuthenticatedSocket) => {
  // Join a game room for real-time updates
  socket.on(WS_CLIENT_EVENTS.GAME_SUBSCRIBE, async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      logger.info('Socket subscribing to game', {
        socketId: socket.id,
        userId,
        gameId,
      });

      // Verify user is participant or spectator
      const game = await gameRepository.findById(gameId);
      if (!game) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.GAME_NOT_FOUND,
          message: 'Game not found',
        });
        return;
      }

      // Join game room
      socket.join(`game:${gameId}`);

      // Send current game state
      const gameState = await GameService.getGameById(gameId);
      socket.emit(WS_SERVER_EVENTS.GAME_STATE, { game: gameState });

      logger.info('Socket subscribed to game successfully', {
        socketId: socket.id,
        gameId,
      });
    } catch (error) {
      logger.error('Failed to subscribe to game', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to subscribe to game',
      });
    }
  });

  // Leave game room
  socket.on(WS_CLIENT_EVENTS.GAME_UNSUBSCRIBE, (data: { gameId: string }) => {
    const { gameId } = data;
    socket.leave(`game:${gameId}`);
    logger.info('Socket unsubscribed from game', {
      socketId: socket.id,
      gameId,
    });
  });

  // Handle cell click
  socket.on(WS_CLIENT_EVENTS.GAME_CLICK_CELL, async (data: { gameId: string; x: number; y: number }, callback?: (response: any) => void) => {
    try {
      const { gameId, x, y } = data;
      const userId = socket.userId;

      if (!userId) {
        const error = {
          success: false,
          error: 'Authentication required',
          code: ERROR_CODES.AUTH_FAILED,
        };
        callback?.(error);
        socket.emit(WS_SERVER_EVENTS.ERROR, error);
        return;
      }

      logger.info('Cell click attempt', {
        userId,
        gameId,
        x,
        y,
      });

      // Validate game exists and is in progress
      const game = await gameRepository.findById(gameId);
      if (!game) {
        const error = {
          success: false,
          error: 'Game not found',
          code: ERROR_CODES.GAME_NOT_FOUND,
        };
        callback?.(error);
        socket.emit(WS_SERVER_EVENTS.ERROR, error);
        return;
      }

      if (game.status !== GAME_STATUS.IN_PROGRESS) {
        const error = {
          success: false,
          error: 'Game is not in progress',
          code: ERROR_CODES.GAME_NOT_STARTED,
        };
        callback?.(error);
        socket.emit(WS_SERVER_EVENTS.GAME_CELL_FAILED, {
          x,
          y,
          reason: 'Game is not in progress',
        });
        return;
      }

      // Verify user is a participant
      const participant = await participantRepository.findByGameAndUser(gameId, userId);
      if (!participant || !participant.is_active) {
        const error = {
          success: false,
          error: 'You are not an active participant',
          code: ERROR_CODES.NOT_IN_GAME,
        };
        callback?.(error);
        socket.emit(WS_SERVER_EVENTS.ERROR, error);
        return;
      }

      // Get current board state from Redis
      const boardData = await getRedisClient().get(`${GAME_BOARD_PREFIX}${gameId}`);
      if (!boardData) {
        const error = {
          success: false,
          error: 'Game board not found',
          code: ERROR_CODES.SERVER_ERROR,
        };
        callback?.(error);
        socket.emit(WS_SERVER_EVENTS.ERROR, error);
        return;
      }

      const board = JSON.parse(boardData);

      // Validate coordinates
      if (x < 0 || x >= board.length || y < 0 || y >= board.length) {
        const error = {
          success: false,
          error: 'Invalid coordinates',
          code: ERROR_CODES.INVALID_MOVE,
        };
        callback?.(error);
        socket.emit(WS_SERVER_EVENTS.GAME_CELL_FAILED, {
          x,
          y,
          reason: 'Invalid coordinates',
        });
        return;
      }

      // Check if cell is already taken
      if (board[y][x] !== null) {
        const error = {
          success: false,
          error: 'Cell already taken',
          code: ERROR_CODES.CELL_TAKEN,
        };
        callback?.(error);
        socket.emit(WS_SERVER_EVENTS.GAME_CELL_FAILED, {
          x,
          y,
          reason: 'Cell already taken',
        });
        return;
      }

      // Claim the cell
      board[y][x] = userId;
      await getRedisClient().set(
        `${GAME_BOARD_PREFIX}${gameId}`,
        JSON.stringify(board),
        'EX',
        GAME_CONFIG.BOARD_CACHE_TTL
      );

      // Record the move in database
      await moveRepository.create({
        game_id: gameId,
        user_id: userId,
        cell_x: x,
        cell_y: y,
      });

      // Increment player's cell count
      await participantRepository.incrementCellsOwned(gameId, userId, 1);

      // Broadcast to all players in the game
      io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.GAME_CELL_CLAIMED, {
        x,
        y,
        userId,
        color: participant.color,
        timestamp: Date.now(),
      });

      // Send success callback
      callback?.({ success: true });

      logger.info('Cell claimed successfully', {
        gameId,
        userId,
        x,
        y,
        color: participant.color,
      });

      // Check if game is over (all cells claimed)
      const isGameOver = board.every((row: any[]) => row.every((cell: any) => cell !== null));
      if (isGameOver) {
        await handleGameEnd(io, gameId);
      }
    } catch (error) {
      logger.error('Failed to process cell click', {
        socketId: socket.id,
        data,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      const errorResponse = {
        success: false,
        error: 'Failed to claim cell',
        code: ERROR_CODES.SERVER_ERROR,
      };
      callback?.(errorResponse);
      socket.emit(WS_SERVER_EVENTS.ERROR, errorResponse);
    }
  });

  // Handle chat messages
  socket.on(WS_CLIENT_EVENTS.CHAT_MESSAGE, async (data: { gameId: string; message: string }) => {
    try {
      const { gameId, message } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      // Validate message
      if (!message || message.trim().length === 0 || message.length > 500) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid message',
        });
        return;
      }

      // Check if user is in the game and is active
      const participant = await participantRepository.findByGameAndUser(gameId, userId);
      if (!participant || !participant.is_active) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.NOT_IN_GAME,
          message: 'You are not in this game',
        });
        return;
      }

      // Get user details
      const user = socket.user;
      
      // Broadcast chat message to all players in the game
      io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.CHAT_MESSAGE, {
        gameId,
        userId,
        userName: user?.name || 'Unknown',
        message: message.trim(),
        timestamp: Date.now(),
      });

      logger.info('Chat message sent', {
        gameId,
        userId,
        messageLength: message.length,
      });
    } catch (error) {
      logger.error('Failed to send chat message', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to send chat message',
      });
    }
  });

  // Handle ready state toggle
  socket.on(WS_CLIENT_EVENTS.PLAYER_READY, async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      // Update participant ready state
      await participantRepository.update(gameId, userId, { is_ready: true });

      // Broadcast ready state to all players
      io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.PLAYER_READY_STATE, {
        gameId,
        userId,
        isReady: true,
      });

      logger.info('Player marked as ready', { gameId, userId });
    } catch (error) {
      logger.error('Failed to update ready state', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to update ready state',
      });
    }
  });

  socket.on(WS_CLIENT_EVENTS.PLAYER_NOT_READY, async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      // Update participant ready state
      await participantRepository.update(gameId, userId, { is_ready: false });

      // Broadcast ready state to all players
      io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.PLAYER_READY_STATE, {
        gameId,
        userId,
        isReady: false,
      });

      logger.info('Player marked as not ready', { gameId, userId });
    } catch (error) {
      logger.error('Failed to update ready state', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to update ready state',
      });
    }
  });

  // Handle forfeit
  socket.on(WS_CLIENT_EVENTS.GAME_FORFEIT, async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const userId = socket.userId;

      if (!userId) {
        socket.emit(WS_SERVER_EVENTS.ERROR, {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Authentication required',
        });
        return;
      }

      logger.info('User forfeiting game', {
        userId,
        gameId,
      });

      // Leave the game
      await GameService.leaveGame(gameId, userId);

      // Check if game should end
      const activeParticipants = await participantRepository.findActiveByGame(gameId);
      if (activeParticipants.length === 1) {
        // Last player wins by default
        await handleGameEnd(io, gameId, activeParticipants[0].user_id);
      }
    } catch (error) {
      logger.error('Failed to forfeit game', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      socket.emit(WS_SERVER_EVENTS.ERROR, {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to forfeit game',
      });
    }
  });
};

// Handle game end
async function handleGameEnd(io: Server, gameId: string, winnerId?: string) {
  try {
    const participants = await participantRepository.findByGame(gameId);
    
    // Determine winner if not specified (player with most cells)
    if (!winnerId) {
      const sortedByScore = participants.sort((a, b) => b.cells_owned - a.cells_owned);
      winnerId = sortedByScore[0].user_id;
    }

    // Update game status
    await gameRepository.update(gameId, {
      status: GAME_STATUS.COMPLETED as GameStatus,
      winner_id: winnerId,
      ended_at: new Date(),
    });

    // Clear the game cache to ensure fresh data
    await getRedisClient().del(`${CACHE_KEYS.GAME}${gameId}`);

    // Get winner info
    const winner = participants.find(p => p.user_id === winnerId);
    const winnerData = winner as any; // Contains joined user data
    const scores = participants.reduce((acc, p) => {
      acc[p.user_id] = p.cells_owned;
      return acc;
    }, {} as Record<string, number>);

    // Clear game board from Redis
    await getRedisClient().del(`${GAME_BOARD_PREFIX}${gameId}`);

    // Broadcast game end
    io.to(`game:${gameId}`).emit(WS_SERVER_EVENTS.GAME_ENDED, {
      winner: {
        id: winnerId,
        name: winnerData?.name || 'Unknown',
      },
      scores,
      timestamp: Date.now(),
    });

    logger.info('Game ended', {
      gameId,
      winnerId,
      scores,
    });
  } catch (error) {
    logger.error('Failed to handle game end', {
      gameId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}