# CubeGame Deployment Guide

## Free Deployment with Render + Upstash

### Prerequisites
1. GitHub repository with your code
2. Render account (https://render.com)
3. Upstash account (https://upstash.com)
4. Google OAuth credentials configured

### Step 1: Deploy PostgreSQL on Render
1. Log in to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Choose Free tier
4. Name: `cubegame-db`
5. Click "Create Database"
6. Copy the connection string (External Database URL)

### Step 2: Setup Redis on Upstash
1. Log in to Upstash Console
2. Create new Redis database (Free tier)
3. Copy the Redis URL

### Step 3: Deploy Backend on Render
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configuration:
   - Name: `cubegame-backend`
   - Environment: Node
   - Build Command: `cd packages/backend && npm install && npm run build`
   - Start Command: `cd packages/backend && npm start`
   - Instance Type: Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Your PostgreSQL URL from Step 1]
   REDIS_URL=[Your Redis URL from Step 2]
   JWT_SECRET=[Generate a secure secret]
   JWT_REFRESH_SECRET=[Generate another secure secret]
   GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
   GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]
   GOOGLE_CALLBACK_URL=https://cubegame-backend.onrender.com/api/auth/google/callback
   FRONTEND_URL=https://cubegame-frontend.onrender.com
   ```

5. Click "Create Web Service"

### Step 4: Deploy Frontend on Render
1. Click "New +" → "Static Site"
2. Connect your GitHub repo
3. Configuration:
   - Name: `cubegame-frontend`
   - Build Command: `cd packages/frontend && npm install && npm run build`
   - Publish Directory: `packages/frontend/dist`
   
4. Add Environment Variables:
   ```
   VITE_API_URL=https://cubegame-backend.onrender.com
   VITE_WS_URL=wss://cubegame-backend.onrender.com
   ```

5. Click "Create Static Site"

### Step 5: Update Google OAuth
1. Go to Google Cloud Console
2. Add authorized redirect URI: `https://cubegame-backend.onrender.com/api/auth/google/callback`
3. Add authorized JavaScript origin: `https://cubegame-frontend.onrender.com`

### Step 6: Initialize Database
1. Go to Render backend service
2. Click "Shell" tab
3. Run: `cd packages/backend && npm run db:migrate`

## Important Notes

### Free Tier Limitations
- **Render**: Services spin down after 15 minutes of inactivity (cold starts ~30s)
- **Upstash**: 10,000 Redis commands per day
- **PostgreSQL**: 1GB storage limit

### Performance Tips
1. Use a loading screen for cold starts
2. Implement connection pooling for PostgreSQL
3. Cache frequently accessed data
4. Consider upgrading to paid tier for production use

### Monitoring
- Render provides basic metrics in dashboard
- Set up error tracking with Sentry (free tier available)
- Monitor Redis usage in Upstash dashboard

## Alternative: Docker Deployment

If you prefer containerized deployment:

```bash
# Build images
docker build -f docker/Dockerfile.backend -t cubegame-backend .
docker build -f docker/Dockerfile.frontend -t cubegame-frontend .

# Deploy to:
# - Google Cloud Run (generous free tier)
# - Azure Container Instances
# - AWS ECS with Fargate
```

## Upgrade Path

When ready for production:
1. Render Starter Plan ($7/month) - No sleep, better performance
2. Dedicated PostgreSQL ($7/month) - Better performance
3. Redis upgrade on Upstash or use Render Redis
4. Add CDN (Cloudflare free tier) for frontend assets