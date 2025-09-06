import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/stores/auth.store';

interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  preferred_color?: string;
}

interface UserStats {
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

interface ProfileResponse {
  user: User;
  stats: UserStats;
}

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  stats: (id: string) => [...userKeys.all, 'stats', id] as const,
};

/**
 * Hook to get current user profile with stats
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const { data } = await apiClient.get<ProfileResponse>('/users/profile');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser, user } = useAuthStore();

  return useMutation({
    mutationFn: async (updateData: UpdateProfileData) => {
      const { data } = await apiClient.patch<{ user: User }>('/users/profile', updateData);
      return data.user;
    },
    onSuccess: (updatedUser) => {
      // Update auth store
      setUser(updatedUser);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
    onError: (error) => {
      console.error('Update profile error:', getErrorMessage(error));
    },
  });
};

/**
 * Hook to get a specific user by ID
 */
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      const { data } = await apiClient.get<{ user: User }>(`/users/${userId}`);
      return data.user;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get user statistics
 */
export const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: userKeys.stats(userId),
    queryFn: async () => {
      const { data } = await apiClient.get<{ stats: UserStats }>(`/users/${userId}/stats`);
      return data.stats;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to search users
 */
export const useSearchUsers = (query: string) => {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get<{ users: User[] }>('/users/search', {
        params: { q: query },
      });
      return data.users;
    },
    enabled: query.length >= 2, // Only search with 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};