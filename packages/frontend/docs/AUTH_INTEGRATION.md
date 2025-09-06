# Frontend Authentication Integration

## Overview

The frontend has been integrated with the backend authentication system using:
- **Cookies** for secure token storage (HTTP-only)
- **TanStack React Query** for API state management
- **Zustand** for client-side auth state
- **Axios** with interceptors for automatic token handling

## Key Components

### 1. API Client (`src/lib/api.ts`)
- Axios instance configured with `withCredentials: true` for cookie support
- Automatic token refresh on 401 errors
- Request/response interceptors for error handling

### 2. Auth Store (`src/stores/auth.store.ts`)
- Simplified store without localStorage persistence
- Cookies handle persistence automatically
- State: `user`, `isAuthenticated`, `isLoading`, `isInitialized`

### 3. Auth Hooks (`src/hooks/useAuth.ts`)
- `useCurrentUser()` - Fetches and caches current user
- `useGoogleLogin()` - Initiates Google OAuth flow
- `useLogout()` - Handles logout and cleanup
- `useRefreshToken()` - Manual token refresh

### 4. User Hooks (`src/hooks/useUser.ts`)
- `useUserProfile()` - Get user profile with stats
- `useUpdateProfile()` - Update user profile
- `useUser(id)` - Get any user by ID
- `useUserStats(id)` - Get user statistics
- `useSearchUsers(query)` - Search users

## Authentication Flow

1. **Login**:
   ```
   User clicks "Sign in with Google"
   → Redirect to backend /api/auth/google
   → Google OAuth flow
   → Backend sets cookies
   → Redirect back to frontend
   → App checks auth status
   ```

2. **Auth Check on Load**:
   - App.tsx uses `useCurrentUser()` hook
   - Sends request to `/api/auth/me` with cookies
   - Updates auth store based on response

3. **Token Refresh**:
   - Automatic: Axios interceptor handles 401 errors
   - Manual: `useRefreshToken()` hook available

4. **Logout**:
   - Calls `/api/auth/logout`
   - Clears cookies and local state
   - Redirects to login page

## Usage Examples

### Protected Routes
```tsx
// AuthGuard automatically checks auth status
<Route element={<AuthGuard />}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>
```

### Using Auth in Components
```tsx
function MyComponent() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: profile, isLoading } = useUserProfile();
  const { mutate: updateProfile } = useUpdateProfile();

  const handleUpdate = () => {
    updateProfile({ 
      name: 'New Name',
      preferredColor: '#FF0044'
    });
  };

  if (isLoading) return <Spinner />;
  
  return <div>Welcome {user?.name}</div>;
}
```

### API Calls
```tsx
// All API calls automatically include cookies
const response = await apiClient.get('/games');

// Custom API call
import { api } from '@/lib/api';
const { data } = await api.get('/custom-endpoint');
```

## Environment Variables

Create `.env` file in frontend:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

## Security Considerations

1. **Cookies**: HTTP-only, secure in production, SameSite=lax
2. **CORS**: Backend configured to accept frontend origin
3. **Token Storage**: No tokens in localStorage/sessionStorage
4. **Auto Refresh**: Tokens refresh automatically on expiry
5. **XSS Protection**: Tokens not accessible via JavaScript

## Troubleshooting

### Common Issues

1. **"No authentication token provided"**
   - Check cookies in browser DevTools
   - Ensure `withCredentials: true` in API calls
   - Verify CORS configuration

2. **Redirect loops**
   - Check `isInitialized` state in auth store
   - Ensure auth check completes before routing

3. **Profile not updating**
   - Check React Query cache invalidation
   - Verify mutation response handling

### Debug Tips

1. Enable React Query DevTools:
   ```tsx
   // Already included in App.tsx
   <ReactQueryDevtools initialIsOpen={false} />
   ```

2. Check auth state:
   ```tsx
   const authState = useAuthStore.getState();
   console.log('Auth state:', authState);
   ```

3. Monitor API calls:
   - Network tab in DevTools
   - Check cookie headers
   - Verify request/response

## Next Steps

1. Add WebSocket authentication
2. Implement rate limiting awareness
3. Add offline support
4. Enhance error notifications
5. Add remember me functionality