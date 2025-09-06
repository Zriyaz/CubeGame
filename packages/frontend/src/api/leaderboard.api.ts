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

export const leaderboardApi = {
  getLeaderboard: async (params?: LeaderboardParams) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    );
    return response.data as LeaderboardEntry[];
  },

  getTopByWins: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/wins${limit ? `?limit=${limit}` : ''}`
    );
    return response.data as LeaderboardEntry[];
  },

  getTopByWinRate: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/win-rate${limit ? `?limit=${limit}` : ''}`
    );
    return response.data as LeaderboardEntry[];
  },

  getWeeklyLeaderboard: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/weekly${limit ? `?limit=${limit}` : ''}`
    );
    return response.data as LeaderboardEntry[];
  },

  getMonthlyLeaderboard: async (limit?: number) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LEADERBOARD}/monthly${limit ? `?limit=${limit}` : ''}`
    );
    return response.data as LeaderboardEntry[];
  },
};