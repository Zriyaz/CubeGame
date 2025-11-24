import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/stores/auth.store';
import { routes } from '@/routes';
import { API_ENDPOINTS } from '@socket-game/shared';

interface AuthResponse {
  user: User;
}

interface LoginResponse extends AuthResponse {
  message: string;
}

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Hook to get current authenticated user
 */
export const useCurrentUser = () => {
  const { setUser, setLoading, setInitialized } = useAuthStore();

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<AuthResponse>(API_ENDPOINTS.AUTH_ME);
        setUser(data.user);
        setInitialized(true);
        return data.user;
      } catch (error: any) {
        // If 401 (unauthorized), this is expected when not logged in
        if (error?.response?.status === 401) {
          setUser(null);
          setInitialized(true);
          return null;
        }
        // For other errors, still mark as initialized to prevent infinite loading
        setInitialized(true);
        setUser(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth requests
    refetchOnWindowFocus: false, // Prevent refetch on window focus to avoid loops
    refetchOnMount: true, // Only refetch on mount
    refetchOnReconnect: false, // Don't refetch on reconnect
    gcTime: Infinity, // Keep data in cache indefinitely
  });
};

/**
 * Hook for Google OAuth login
 */
export const useGoogleLogin = () => {
  const { setLoading } = useAuthStore();

  const login = () => {
    setLoading(true);
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return { login };
};

/**
 * Hook for logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { reset } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT);
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Reset auth store
      reset();
      
      // Navigate to login
      navigate(routes.landing);
    },
    onError: (error) => {
      console.error('Logout error:', getErrorMessage(error));
      // Even if logout fails, clear local state
      queryClient.clear();
      reset();
      navigate(routes.landing);
    },
  });
};

/**
 * Hook for refreshing auth token
 */
export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH_REFRESH);
      return data;
    },
    onSuccess: (data) => {
      // Update user in store
      if (data.user) {
        setUser(data.user);
        // Invalidate user query to refetch with new token
        queryClient.invalidateQueries({ queryKey: authKeys.user() });
      }
    },
  });
};