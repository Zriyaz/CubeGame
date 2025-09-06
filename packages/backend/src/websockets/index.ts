import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { authenticateSocket, AuthenticatedSocket } from './auth.middleware';
import { setupGameHandlers } from './game.handlers';
import { GameParticipantRepository } from '../repositories/game-participant.repository';
import {
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
  ERROR_CODES,
  GAME_CONFIG,
  ROOM_PREFIXES
} from '@socket-game/shared';

const participantRepository = new GameParticipantRepository();

export const initializeWebSocket = (io: Server) => {
  logger.info('Initializing WebSocket server');

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', async (socket: AuthenticatedSocket) => {
    logger.info('New authenticated WebSocket connection', {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.user?.name,
    });

    // Send authentication confirmation
    socket.emit(WS_SERVER_EVENTS.AUTHENTICATED, {
      userId: socket.userId,
      sessionId: socket.id,
    });

    // Set up game event handlers
    setupGameHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });

      // Clear activity tracking interval
      if (socket.activityInterval) {
        clearInterval(socket.activityInterval);
      }

      // Get all rooms the socket was in
      const rooms = Array.from(socket.rooms).filter(room => room.startsWith(ROOM_PREFIXES.GAME));
      
      // Notify other players in each game
      for (const room of rooms) {
        const gameId = room.replace(ROOM_PREFIXES.GAME, '');
        socket.to(room).emit(WS_SERVER_EVENTS.GAME_PLAYER_DISCONNECTED, {
          userId: socket.userId,
          timestamp: Date.now(),
        });

        // Mark player as inactive after 30 seconds if not reconnected
        if (socket.userId) {
          setTimeout(async () => {
            try {
              // Check if user has reconnected
              const userSockets = await io.in(`${ROOM_PREFIXES.USER}${socket.userId}`).fetchSockets();
              if (userSockets.length === 0) {
                // User hasn't reconnected, mark as inactive
                const participant = await participantRepository.findByGameAndUser(gameId, socket.userId!);
                if (participant && participant.is_active) {
                  await participantRepository.update(gameId, socket.userId!, {
                    is_active: false,
                  });
                  
                  io.to(room).emit(WS_SERVER_EVENTS.GAME_PLAYER_INACTIVE, {
                    userId: socket.userId,
                  });
                }
              }
            } catch (error) {
              logger.error('Failed to handle disconnect timeout', {
                gameId,
                userId: socket.userId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }, GAME_CONFIG.DISCONNECT_GRACE_PERIOD);
        }
      }
    });

    // Handle reconnection
    socket.on(WS_CLIENT_EVENTS.GAME_RECONNECT, async (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        const userId = socket.userId;

        if (!userId) {
          socket.emit('error', {
            code: 'AUTH_FAILED',
            message: 'Authentication required',
          });
          return;
        }

        // Check if user is a participant
        const participant = await participantRepository.findByGameAndUser(gameId, userId);
        if (!participant) {
          socket.emit('error', {
            code: 'NOT_IN_GAME',
            message: 'You are not in this game',
          });
          return;
        }

        // Rejoin game room
        socket.join(`${ROOM_PREFIXES.GAME}${gameId}`);

        // Mark as active again if was inactive
        if (!participant.is_active) {
          await participantRepository.update(gameId, userId, {
            is_active: true,
          });
        }

        // Notify others of reconnection
        socket.to(`${ROOM_PREFIXES.GAME}${gameId}`).emit(WS_SERVER_EVENTS.GAME_PLAYER_RECONNECTED, {
          userId,
        });

        logger.info('Player reconnected to game', {
          userId,
          gameId,
        });
      } catch (error) {
        logger.error('Failed to handle reconnection', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        socket.emit('error', {
          code: 'SERVER_ERROR',
          message: 'Failed to reconnect to game',
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  });
};