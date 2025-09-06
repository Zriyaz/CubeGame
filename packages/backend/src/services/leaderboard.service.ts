import { Pool } from 'pg';
import { getPool } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url?: string;
  total_games: number;
  total_wins: number;
  win_rate: number;
  games_this_week?: number;
  wins_this_week?: number;
  games_this_month?: number;
  wins_this_month?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  limit: number;
  type: string;
}

export type LeaderboardType = 'wins' | 'winRate' | 'weekly' | 'monthly';

export class LeaderboardService {
  private static get pool(): Pool {
    return getPool();
  }

  /**
   * Get top players by total wins
   */
  static async getTopPlayersByWins(limit: number = 10): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        COUNT(gp.game_id) as total_games,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as total_wins,
        CASE 
          WHEN COUNT(gp.game_id) > 0 
          THEN ROUND(COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) * 100.0 / COUNT(gp.game_id), 2)
          ELSE 0 
        END as win_rate
      FROM users u
      JOIN game_participants gp ON u.id = gp.user_id
      JOIN games g ON gp.game_id = g.id AND g.status = 'completed'
      GROUP BY u.id, u.name, u.avatar_url
      HAVING COUNT(gp.game_id) > 0
      ORDER BY total_wins DESC, win_rate DESC, total_games DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows.map(row => ({
        ...row,
        total_games: parseInt(row.total_games),
        total_wins: parseInt(row.total_wins),
        win_rate: parseFloat(row.win_rate)
      }));
    } catch (error) {
      logger.error('Error fetching top players by wins', { error });
      throw new AppError(500, 'Failed to fetch leaderboard data');
    }
  }

  /**
   * Get top players by win rate (minimum 5 games)
   */
  static async getTopPlayersByWinRate(limit: number = 10): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        COUNT(gp.game_id) as total_games,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as total_wins,
        ROUND(COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) * 100.0 / COUNT(gp.game_id), 2) as win_rate
      FROM users u
      JOIN game_participants gp ON u.id = gp.user_id
      JOIN games g ON gp.game_id = g.id AND g.status = 'completed'
      GROUP BY u.id, u.name, u.avatar_url
      HAVING COUNT(gp.game_id) >= 5
      ORDER BY win_rate DESC, total_wins DESC, total_games DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows.map(row => ({
        ...row,
        total_games: parseInt(row.total_games),
        total_wins: parseInt(row.total_wins),
        win_rate: parseFloat(row.win_rate)
      }));
    } catch (error) {
      logger.error('Error fetching top players by win rate', { error });
      throw new AppError(500, 'Failed to fetch leaderboard data');
    }
  }

  /**
   * Get top players for current week
   */
  static async getTopPlayersThisWeek(limit: number = 10): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        COUNT(gp.game_id) as games_this_week,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins_this_week,
        CASE 
          WHEN COUNT(gp.game_id) > 0 
          THEN ROUND(COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) * 100.0 / COUNT(gp.game_id), 2)
          ELSE 0 
        END as win_rate,
        -- Also get total stats for context
        (SELECT COUNT(*) FROM game_participants gp2 
         JOIN games g2 ON gp2.game_id = g2.id 
         WHERE gp2.user_id = u.id AND g2.status = 'completed') as total_games,
        (SELECT COUNT(*) FROM game_participants gp3 
         JOIN games g3 ON gp3.game_id = g3.id 
         WHERE gp3.user_id = u.id AND g3.status = 'completed' AND g3.winner_id = u.id) as total_wins
      FROM users u
      JOIN game_participants gp ON u.id = gp.user_id
      JOIN games g ON gp.game_id = g.id 
      WHERE g.status = 'completed' 
        AND g.ended_at >= DATE_TRUNC('week', CURRENT_TIMESTAMP)
        AND g.ended_at < DATE_TRUNC('week', CURRENT_TIMESTAMP) + INTERVAL '1 week'
      GROUP BY u.id, u.name, u.avatar_url
      HAVING COUNT(gp.game_id) > 0
      ORDER BY wins_this_week DESC, win_rate DESC, games_this_week DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        avatar_url: row.avatar_url,
        total_games: parseInt(row.total_games),
        total_wins: parseInt(row.total_wins),
        win_rate: parseFloat(row.win_rate),
        games_this_week: parseInt(row.games_this_week),
        wins_this_week: parseInt(row.wins_this_week)
      }));
    } catch (error) {
      logger.error('Error fetching weekly leaderboard', { error });
      throw new AppError(500, 'Failed to fetch leaderboard data');
    }
  }

  /**
   * Get top players for current month
   */
  static async getTopPlayersThisMonth(limit: number = 10): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        COUNT(gp.game_id) as games_this_month,
        COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) as wins_this_month,
        CASE 
          WHEN COUNT(gp.game_id) > 0 
          THEN ROUND(COUNT(CASE WHEN g.winner_id = u.id THEN 1 END) * 100.0 / COUNT(gp.game_id), 2)
          ELSE 0 
        END as win_rate,
        -- Also get total stats for context
        (SELECT COUNT(*) FROM game_participants gp2 
         JOIN games g2 ON gp2.game_id = g2.id 
         WHERE gp2.user_id = u.id AND g2.status = 'completed') as total_games,
        (SELECT COUNT(*) FROM game_participants gp3 
         JOIN games g3 ON gp3.game_id = g3.id 
         WHERE gp3.user_id = u.id AND g3.status = 'completed' AND g3.winner_id = u.id) as total_wins
      FROM users u
      JOIN game_participants gp ON u.id = gp.user_id
      JOIN games g ON gp.game_id = g.id 
      WHERE g.status = 'completed' 
        AND g.ended_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
        AND g.ended_at < DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
      GROUP BY u.id, u.name, u.avatar_url
      HAVING COUNT(gp.game_id) > 0
      ORDER BY wins_this_month DESC, win_rate DESC, games_this_month DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        avatar_url: row.avatar_url,
        total_games: parseInt(row.total_games),
        total_wins: parseInt(row.total_wins),
        win_rate: parseFloat(row.win_rate),
        games_this_month: parseInt(row.games_this_month),
        wins_this_month: parseInt(row.wins_this_month)
      }));
    } catch (error) {
      logger.error('Error fetching monthly leaderboard', { error });
      throw new AppError(500, 'Failed to fetch leaderboard data');
    }
  }

  /**
   * Get leaderboard based on type
   */
  static async getLeaderboard(type: LeaderboardType, limit: number = 10): Promise<LeaderboardResponse> {
    let entries: LeaderboardEntry[];

    switch (type) {
      case 'wins':
        entries = await this.getTopPlayersByWins(limit);
        break;
      case 'winRate':
        entries = await this.getTopPlayersByWinRate(limit);
        break;
      case 'weekly':
        entries = await this.getTopPlayersThisWeek(limit);
        break;
      case 'monthly':
        entries = await this.getTopPlayersThisMonth(limit);
        break;
      default:
        throw new AppError(400, 'Invalid leaderboard type. Must be one of: wins, winRate, weekly, monthly');
    }

    logger.info('Leaderboard fetched successfully', { 
      type, 
      limit, 
      entriesCount: entries.length 
    });

    return {
      entries,
      total: entries.length,
      limit,
      type
    };
  }
}