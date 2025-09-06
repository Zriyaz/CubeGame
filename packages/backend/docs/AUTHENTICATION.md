# Authentication System Documentation

## Overview

The backend now has a complete authentication system with Google OAuth 2.0, JWT tokens, and user profile management.

## Features Implemented

### 1. Google OAuth Authentication
- **Endpoint**: `GET /api/auth/google`
- **Callback**: `GET /api/auth/google/callback`
- **Description**: Initiates Google OAuth flow and handles the callback
- **Cookies Set**: `accessToken` and `refreshToken` as HTTP-only secure cookies

### 2. JWT Token Management
- **Access Token**: Short-lived (7 days by default)
- **Refresh Token**: Long-lived (30 days by default)
- **Token Storage**: Refresh tokens are stored in Redis for validation
- **Token Refresh**: `POST /api/auth/refresh`

### 3. User Authentication Endpoints
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout and invalidate tokens
- `POST /api/auth/refresh` - Refresh access token using refresh token

### 4. User Profile Management
- `GET /api/users/profile` - Get current user profile with stats
- `PATCH /api/users/profile` - Update user profile (name, avatar, color)
- `GET /api/users/:userId` - Get any user's public profile
- `GET /api/users/:userId/stats` - Get user statistics
- `GET /api/users/search?q=query` - Search users by name or email

## Security Features

1. **Secure Cookies**: HTTP-only, secure cookies in production
2. **Token Validation**: All tokens are cryptographically signed and validated
3. **Request Authentication**: Protected routes require valid access token
4. **Input Validation**: All endpoints have proper input validation
5. **Error Handling**: Consistent error responses with proper status codes
6. **Logging**: Comprehensive logging for all authentication events

## Environment Variables Required

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

## Authentication Flow

1. User clicks "Sign in with Google" on frontend
2. Frontend redirects to `/api/auth/google`
3. User authenticates with Google
4. Google redirects to `/api/auth/google/callback`
5. Backend creates/updates user, generates tokens
6. Backend sets cookies and redirects to frontend dashboard
7. Frontend uses cookies for authenticated API requests

## Token Usage

### In Requests
Tokens can be sent in two ways:
1. **Cookie**: Automatically sent with requests (preferred)
2. **Header**: `Authorization: Bearer <token>`

### Token Refresh
When access token expires:
1. Frontend calls `/api/auth/refresh` with refresh token
2. Backend validates refresh token and issues new token pair
3. Frontend updates cookies/storage with new tokens

## User Statistics

The system tracks:
- Total games played
- Games won/lost
- Win rate percentage
- Cells captured
- Win streaks
- Play time
- User rank and level

## Next Steps

1. Implement rate limiting on auth endpoints
2. Add WebSocket authentication for real-time features
3. Implement social features (friends, invites)
4. Add email notifications
5. Implement two-factor authentication (optional)