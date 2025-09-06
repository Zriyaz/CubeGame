import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, type LeaderboardType } from '@/api/leaderboard.api';

// Query keys
export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  lists: () => [...leaderboardKeys.all, 'list'] as const,
  list: (type: LeaderboardType) => [...leaderboardKeys.lists(), type] as const,
};

// Hooks
export const useLeaderboard = (type: LeaderboardType = 'wins', limit: number = 10) => {
  return useQuery({
    queryKey: leaderboardKeys.list(type),
    queryFn: () => leaderboardApi.getLeaderboard({ type, limit }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useTopByWins = (limit: number = 10) => {
  return useQuery({
    queryKey: leaderboardKeys.list('wins'),
    queryFn: () => leaderboardApi.getTopByWins(limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useTopByWinRate = (limit: number = 10) => {
  return useQuery({
    queryKey: leaderboardKeys.list('winRate'),
    queryFn: () => leaderboardApi.getTopByWinRate(limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useWeeklyLeaderboard = (limit: number = 10) => {
  return useQuery({
    queryKey: leaderboardKeys.list('weekly'),
    queryFn: () => leaderboardApi.getWeeklyLeaderboard(limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useMonthlyLeaderboard = (limit: number = 10) => {
  return useQuery({
    queryKey: leaderboardKeys.list('monthly'),
    queryFn: () => leaderboardApi.getMonthlyLeaderboard(limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};