# Google OAuth Setup Guide

## Prerequisites
- Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "Socket Game" (or your preferred name)
5. Click "CREATE"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields:
     - App name: "Socket Game"
     - User support email: your email
     - Developer contact email: your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

4. Back to creating OAuth client ID:
   - Application type: "Web application"
   - Name: "Socket Game Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:5000`
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
   - Click "CREATE"

5. Save your credentials:
   - Client ID: `your-client-id-here`
   - Client Secret: `your-client-secret-here`

## Step 4: Configure Backend Environment

1. Create `.env` file in `packages/backend/` if it doesn't exist
2. Add the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/socket_game

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Logging
LOG_LEVEL=info
```

## Step 5: Test the Authentication Flow

1. Make sure Redis is running:
   ```bash
   redis-server
   ```

2. Make sure PostgreSQL is running and database is created:
   ```bash
   createdb socket_game
   ```

3. Run database migrations:
   ```bash
   cd packages/backend
   npm run db:migrate
   ```

4. Start the backend:
   ```bash
   npm run dev
   ```

5. Start the frontend:
   ```bash
   cd packages/frontend
   npm run dev
   ```

6. Visit http://localhost:5173 and click "Sign in with Google"

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:5000/api/auth/google/callback`
- Check that there are no trailing slashes

### "Cannot GET /api/auth/google"
- Ensure backend is running on port 5000
- Check that CORS is configured correctly

### "Database connection failed"
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations: `npm run db:migrate`

### "Redis connection failed"
- Ensure Redis is running: `redis-server`
- Check REDIS_URL in .env

## Production Setup

For production, you'll need to:

1. Update authorized origins and redirect URIs in Google Console
2. Use HTTPS URLs
3. Update environment variables with production values
4. Use secure JWT secret
5. Enable secure cookies