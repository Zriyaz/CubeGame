import userRepository from '../repositories/user.repository';
import { User } from '../models/user.model';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';

export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  preferred_color?: string;
}

export interface UserStats {
  totalGames: number;
  gamesWon: number;
  winRate: number;
  totalCellsCaptured: number;
  averageCellsPerGame: number;
  longestWinStreak: number;
  currentStreak: number;
  totalPlayTime: number;
  rank: string;
  level: number;
}

export class UserService {
  private static readonly USER_CACHE_PREFIX = 'user:';
  private static readonly USER_STATS_CACHE_PREFIX = 'user_stats:';
  private static readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      logger.info('Getting user by ID', { userId });

      // Try cache first
      const cached = await getRedisClient().get(`${this.USER_CACHE_PREFIX}${userId}`);
      if (cached) {
        logger.debug('User found in cache', { userId });
        return JSON.parse(cached);
      }

      // Get from database
      const user = await userRepository.findById(userId);
      
      if (user) {
        // Cache the result
        await getRedisClient().set(
          `${this.USER_CACHE_PREFIX}${userId}`,
          JSON.stringify(user),
          'EX',
          this.CACHE_TTL
        );
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by ID', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: UpdateProfileData
  ): Promise<User> {
    try {
      logger.info('Updating user profile', {
        userId,
        updates: Object.keys(data),
      });

      // Validate color if provided
      if (data.preferred_color) {
        const validColors = [
          '#FF0044', '#0099FF', '#00FF44', '#FFBB00',
          '#BB00FF', '#FF8800', '#00FFCC', '#FF00AA'
        ];
        
        if (!validColors.includes(data.preferred_color)) {
          throw new AppError(400, 'Invalid preferred color');
        }
      }

      // Update user
      const updatedUser = await userRepository.update(userId, data);
      if (!updatedUser) {
        throw new AppError(404, 'User not found');
      }

      // Invalidate cache
      await getRedisClient().del(`${this.USER_CACHE_PREFIX}${userId}`);

      logger.info('User profile updated successfully', {
        userId,
        name: updatedUser.name,
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user profile', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      logger.info('Getting user statistics', { userId });

      // Try cache first
      const cached = await getRedisClient().get(`${this.USER_STATS_CACHE_PREFIX}${userId}`);
      if (cached) {
        logger.debug('User stats found in cache', { userId });
        return JSON.parse(cached);
      }

      // Get stats from database
      const stats = await userRepository.getUserStatistics(userId);
      if (!stats) {
        // Return default stats for new users
        return {
          totalGames: 0,
          gamesWon: 0,
          winRate: 0,
          totalCellsCaptured: 0,
          averageCellsPerGame: 0,
          longestWinStreak: 0,
          currentStreak: 0,
          totalPlayTime: 0,
          rank: 'Beginner',
          level: 1,
        };
      }

      // Map database fields to our interface
      const gamesPlayed = stats.games_played || 0;
      const gamesWon = stats.games_won || 0;
      
      // Calculate derived stats
      const userStats: UserStats = {
        totalGames: gamesPlayed,
        gamesWon: gamesWon,
        winRate: gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0,
        totalCellsCaptured: stats.max_cells_in_game || 0, // Using max cells as approximation
        averageCellsPerGame: stats.avg_cells_per_game || 0,
        longestWinStreak: 0, // Not tracked in current schema
        currentStreak: 0, // Not tracked in current schema
        totalPlayTime: 0, // Not tracked in current schema
        rank: this.calculateRank(gamesPlayed, gamesWon),
        level: this.calculateLevel(gamesPlayed, gamesWon),
      };

      // Cache the result
      await getRedisClient().set(
        `${this.USER_STATS_CACHE_PREFIX}${userId}`,
        JSON.stringify(userStats),
        'EX',
        this.CACHE_TTL
      );

      return userStats;
    } catch (error) {
      logger.error('Failed to get user statistics', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query: string): Promise<User[]> {
    try {
      logger.info('Searching users', { query });

      if (query.length < 2) {
        return [];
      }

      const users = await userRepository.searchUsers(query);

      logger.info('User search completed', {
        query,
        resultCount: users.length,
      });

      return users;
    } catch (error) {
      logger.error('Failed to search users', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Calculate user rank based on stats
   */
  private static calculateRank(totalGames: number, gamesWon: number): string {
    const winRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

    if (totalGames < 10) return 'Beginner';
    if (totalGames < 50 && winRate < 40) return 'Rookie';
    if (totalGames < 100 && winRate < 50) return 'Amateur';
    if (totalGames < 200 && winRate < 60) return 'Professional';
    if (totalGames < 500 && winRate < 70) return 'Expert';
    if (winRate >= 70) return 'Master';
    if (winRate >= 80 && totalGames >= 500) return 'Grandmaster';
    
    return 'Intermediate';
  }

  /**
   * Calculate user level based on games played and won
   */
  private static calculateLevel(totalGames: number, gamesWon: number): number {
    // Simple level calculation: 1 level per 10 games + 1 level per 5 wins
    const baseLevel = Math.floor(totalGames / 10);
    const winBonus = Math.floor(gamesWon / 5);
    return Math.min(1 + baseLevel + winBonus, 50); // Cap at level 50
  }

  /**
   * Track user activity in Redis
   */
  static async trackUserActivity(userId: string): Promise<void> {
    const key = `active_users`;
    const timestamp = Date.now();
    await getRedisClient().zadd(key, timestamp, userId);
    
    // Remove users inactive for more than 5 minutes
    const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
    await getRedisClient().zremrangebyscore(key, '-inf', fiveMinutesAgo.toString());
  }

  /**
   * Get active users (active in last 5 minutes)
   */
  static async getActiveUsers(): Promise<any[]> {
    try {
      const key = `active_users`;
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      // Get user IDs active in the last 5 minutes
      const userIds = await getRedisClient().zrangebyscore(
        key,
        fiveMinutesAgo,
        '+inf'
      );

      if (!userIds || userIds.length === 0) {
        return [];
      }

      // Get user details
      const users = await Promise.all(
        userIds.map(async (userId) => {
          const user = await this.getUserById(userId);
          if (user) {
            // Get current game if any
            const currentGame = await getRedisClient().get(`user_current_game:${userId}`);
            return {
              id: user.id,
              name: user.name,
              avatarUrl: user.avatar_url,
              isInGame: !!currentGame,
              gameId: currentGame,
            };
          }
          return null;
        })
      );

      return users.filter(Boolean);
    } catch (error) {
      logger.error('Failed to get active users', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get online users excluding the current user
   */
  static async getOnlineUsers(excludeUserId: string): Promise<any[]> {
    try {
      const key = `active_users`;
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      // Get user IDs active in the last 5 minutes
      const userIds = await getRedisClient().zrangebyscore(
        key,
        fiveMinutesAgo,
        '+inf'
      );

      if (!userIds || userIds.length === 0) {
        return [];
      }

      // Filter out current user and get user details
      const users = await Promise.all(
        userIds
          .filter(userId => userId !== excludeUserId)
          .map(async (userId) => {
            const user = await this.getUserById(userId);
            if (user) {
              // Get current game if any
              const currentGame = await getRedisClient().get(`user_current_game:${userId}`);
              return {
                id: user.id,
                name: user.name,
                avatarUrl: user.avatar_url,
                isInGame: !!currentGame,
                gameId: currentGame,
              };
            }
            return null;
          })
      );

      return users.filter(Boolean);
    } catch (error) {
      logger.error('Failed to get online users', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }
}