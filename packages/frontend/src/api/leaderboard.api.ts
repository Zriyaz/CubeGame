import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@socket-game/shared';

export type LeaderboardType = 'wins' | 'winRate' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string | null;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

export interface LeaderboardParams {
  type?: LeaderboardType;
  limit?: number;
}

// Helper function to transform API response to frontend format
const transformLeaderboardEntry = (entry: any): LeaderboardEntry => ({
  userId: entry.id,
  username: entry.name,
  avatar: entry.avatar_url || null,
  wins: entry.total_wins || 0,
  losses: entry.total_games - entry.total_wins || 0,
  totalGames: entry.total_games || 0,
  winRate: entry.win_rate || 0,
});

export const leaderboardApi = {
  getLeaderboard: async (params?: LeaderboardParams) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    );
    
    // Transform the response data
    const entries = response.data.entries || [];
    return entries.map(transformLeaderboardEntry);
  },

  getTopByWins: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/wins${limit ? `?limit=${limit}` : ''}`
    );
    const entries = response.data.entries || [];
    return entries.map(transformLeaderboardEntry);
  },

  getTopByWinRate: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/win-rate${limit ? `?limit=${limit}` : ''}`
    );
    const entries = response.data.entries || [];
    return entries.map(transformLeaderboardEntry);
  },

  getWeeklyLeaderboard: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/weekly${limit ? `?limit=${limit}` : ''}`
    );
    const entries = response.data.entries || [];
    return entries.map(transformLeaderboardEntry);
  },

  getMonthlyLeaderboard: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/monthly${limit ? `?limit=${limit}` : ''}`
    );
    const entries = response.data.entries || [];
    return entries.map(transformLeaderboardEntry);
  },
};