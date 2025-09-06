import { Profile as GoogleProfile } from 'passport-google-oauth20';
import userRepository from '../repositories/user.repository';
import { User } from '../models/user.model';
import { JWTUtils } from '../utils/jwt.utils';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export class AuthService {
  private static readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private static readonly USER_SESSION_PREFIX = 'user_session:';
  private static readonly SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  /**
   * Authenticate or create user from Google OAuth profile
   */
  static async authenticateWithGoogle(profile: GoogleProfile): Promise<AuthResponse> {
    try {
      // Extract user data from Google profile
      const email = profile.emails?.[0]?.value;
      if (!email) {
        throw new AppError(400, 'No email found in Google profile');
      }

      const googleId = profile.id;
      const name = profile.displayName;
      const avatarUrl = profile.photos?.[0]?.value;

      // Check if user exists
      let user = await userRepository.findByGoogleId(googleId);

      if (!user) {
        // Create new user
        user = await userRepository.create({
          googleId,
          email,
          name,
          avatarUrl,
        });
        logger.info(`New user created: ${user.id}`);
      } else {
        // Update existing user's profile if needed
        if (user.name !== name || user.avatar_url !== avatarUrl) {
          user = await userRepository.update(user.id, {
            name,
            avatar_url: avatarUrl,
          });
          if (user) {
            logger.info(`User profile updated: ${user.id}`);
          }
        }
      }

      // Ensure user is not null
      if (!user) {
        throw new AppError(500, 'Failed to create or update user');
      }

      // Generate tokens
      const tokens = JWTUtils.generateTokenPair(user);

      // Store refresh token in Redis
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      // Store user session
      await this.storeUserSession(user.id, user);

      return { user, tokens };
    } catch (error) {
      logger.error('Google authentication failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = JWTUtils.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new AppError(401, 'Invalid token type');
      }

      // Check if refresh token exists in Redis
      const storedToken = await getRedisClient().get(
        `${this.REFRESH_TOKEN_PREFIX}${decoded.userId}`
      );

      if (storedToken !== refreshToken) {
        throw new AppError(401, 'Invalid refresh token');
      }

      // Get user from database
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Generate new token pair
      const tokens = JWTUtils.generateTokenPair(user);

      // Update refresh token in Redis
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout user by invalidating tokens
   */
  static async logout(userId: string): Promise<void> {
    try {
      // Remove refresh token
      await getRedisClient().del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
      
      // Remove user session
      await getRedisClient().del(`${this.USER_SESSION_PREFIX}${userId}`);
      
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get current user from access token
   */
  static async getCurrentUser(userId: string): Promise<User> {
    try {
      // Try to get from Redis cache first
      const cached = await getRedisClient().get(`${this.USER_SESSION_PREFIX}${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Store in cache
      await this.storeUserSession(userId, user);

      return user;
    } catch (error) {
      logger.error('Get current user failed:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  static validateAccessToken(token: string): string {
    try {
      const decoded = JWTUtils.verifyToken(token);
      
      if (decoded.type !== 'access') {
        throw new AppError(401, 'Invalid token type');
      }

      return decoded.userId;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(401, error.message);
      }
      throw error;
    }
  }

  /**
   * Store refresh token in Redis
   */
  private static async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    await getRedisClient().set(
      `${this.REFRESH_TOKEN_PREFIX}${userId}`,
      refreshToken,
      'EX',
      this.SESSION_TTL
    );
  }

  /**
   * Store user session in Redis
   */
  private static async storeUserSession(userId: string, user: User): Promise<void> {
    await getRedisClient().set(
      `${this.USER_SESSION_PREFIX}${userId}`,
      JSON.stringify(user),
      'EX',
      60 * 60 // 1 hour cache
    );
  }
}