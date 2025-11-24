import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: This ensures cookies are sent with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // The auth token is handled by cookies, so we don't need to add it manually
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh for certain endpoints
      const skipRefreshEndpoints = ['/api/auth/me', '/api/auth/refresh'];
      if (skipRefreshEndpoints.some(endpoint => originalRequest.url?.includes(endpoint))) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await api.post('/api/auth/refresh');
        
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        
        // Don't redirect - let the app handle auth state naturally
        // The useCurrentUser hook will handle 401 errors gracefully
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API error type
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Helper function to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
};

// Type-safe API methods
export const apiClient = {
  get: <T = any>(url: string, config?: any) => api.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => api.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => api.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any) => api.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => api.delete<T>(url, config),
};