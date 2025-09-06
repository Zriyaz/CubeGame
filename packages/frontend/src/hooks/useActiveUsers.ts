import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@socket-game/shared';

export interface ActiveUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  isInGame: boolean;
  gameId: string | null;
}

interface ActiveUsersResponse {
  users: ActiveUser[];
  count: number;
}

// Query keys
export const activeUsersKeys = {
  all: ['activeUsers'] as const,
  list: () => [...activeUsersKeys.all, 'list'] as const,
};

/**
 * Hook to fetch active users
 */
export const useActiveUsers = () => {
  return useQuery({
    queryKey: activeUsersKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<ActiveUsersResponse>(API_ENDPOINTS.USERS_ACTIVE);
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
};