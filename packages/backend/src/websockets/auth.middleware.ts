import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { JWTUtils } from '../utils/jwt.utils';
import userRepository from '../repositories/user.repository';
import { logger } from '../utils/logger';
import { ROOM_PREFIXES } from '@socket-game/shared';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
  activityInterval?: NodeJS.Timeout;
}

export const authenticateSocket = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // First check for cookie-based auth
    const cookies = socket.handshake.headers.cookie;
    logger.info('WebSocket auth attempt', {
      socketId: socket.id,
      hasCookies: !!cookies,
      authToken: socket.handshake.auth.token,
      cookieHeader: cookies?.substring(0, 200), // Log first 200 chars
      headers: Object.keys(socket.handshake.headers),
      origin: socket.handshake.headers.origin
    });
    
    if (cookies && socket.handshake.auth.token === 'cookie-auth') {
      // Parse cookies to get auth token
      const cookieObj = cookies.split(';').reduce((acc: any, cookie: string) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = decodeURIComponent(value || '');
        return acc;
      }, {});
      
      logger.info('Parsed cookies', {
        socketId: socket.id,
        cookieKeys: Object.keys(cookieObj),
        hasAccessToken: !!cookieObj.access_token
      });
      
      const authToken = cookieObj.access_token;
      if (authToken) {
        try {
          const payload = JWTUtils.verifyToken(authToken);
          if (payload && typeof payload === 'object') {
            const userId = (payload as any).id || (payload as any).userId;
            if (!userId) {
              throw new Error('Invalid token payload - missing user ID');
            }
            const user = await userRepository.findById(userId);
            if (user) {
              socket.userId = user.id;
              socket.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatar_url,
              };
              
              socket.join(`${ROOM_PREFIXES.USER}${user.id}`);
              
              const { UserService } = await import('../services/user.service');
              await UserService.trackUserActivity(user.id);
              
              socket.activityInterval = setInterval(async () => {
                await UserService.trackUserActivity(user.id);
              }, 60000);
              
              logger.info('WebSocket authenticated via cookie', {
                socketId: socket.id,
                userId: user.id,
                userName: user.name,
              });
              
              return next();
            }
          }
        } catch (error) {
          logger.error('Cookie auth failed', { error });
        }
      }
    }
    
    // Fall back to token-based auth
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token || token === 'cookie-auth') {
      logger.warn('WebSocket connection attempt without valid auth', {
        socketId: socket.id,
        ip: socket.handshake.address,
      });
      return next(new Error('No authentication provided'));
    }

    // Extract token if it includes "Bearer " prefix
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
      // Verify JWT token
      const payload = JWTUtils.verifyToken(cleanToken);
      if (!payload || typeof payload === 'string') {
        throw new Error('Invalid token payload');
      }

      const decoded = payload as any; // JWT payload type
      // Check for both 'id' and 'userId' fields for compatibility
      const userId = decoded.id || decoded.userId;
      if (!userId) {
        throw new Error('Invalid token payload - missing user ID');
      }

      // Get user from database
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
      };

      // Join user's personal room for notifications
      socket.join(`${ROOM_PREFIXES.USER}${user.id}`);

      // Track user activity
      const { UserService } = await import('../services/user.service');
      await UserService.trackUserActivity(user.id);

      // Set up interval to track activity while connected
      socket.activityInterval = setInterval(async () => {
        await UserService.trackUserActivity(user.id);
      }, 60000); // Track every minute

      logger.info('WebSocket authenticated successfully', {
        socketId: socket.id,
        userId: user.id,
        userName: user.name,
      });

      next();
    } catch (error) {
      logger.error('WebSocket authentication failed', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(new Error('Authentication failed'));
    }
  } catch (error) {
    logger.error('WebSocket middleware error', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(new Error('Internal server error'));
  }
};

export const optionalAuthSocket = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
  
  if (!token) {
    // No token provided, but that's okay for optional auth
    return next();
  }

  // If token is provided, try to authenticate
  return authenticateSocket(socket, next);
};