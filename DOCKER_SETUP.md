# Docker Setup Guide - CubeGame

## 🐳 Running the Application with Docker

This guide will help you run the entire CubeGame application using Docker Compose.

## Prerequisites

- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)

## Quick Start

### Step 1: Set Up Environment Variables

Create a `.env` file in the root directory (optional - for overriding defaults):

```env
# Google OAuth (Required - get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secrets (Optional - defaults provided)
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
```

**Or** update the values directly in `docker-compose.yml` under the `backend` service environment section.

### Step 2: Build and Start All Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

This will start:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **Backend** on port `5000`
- **Frontend** on port `5173`

### Step 3: Run Database Migrations

In a new terminal (while Docker is running):

```bash
# Run migrations
docker-compose exec backend npm run db:migrate
```

### Step 4: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Docker Services

### PostgreSQL Database
- **Container**: `socket-game-postgres`
- **Port**: `5432`
- **Database**: `socket_game`
- **User**: `postgres`
- **Password**: `postgres123`
- **Volume**: `postgres_data` (persists data)

### Redis Cache
- **Container**: `socket-game-redis`
- **Port**: `6379`
- **Password**: `redis123`
- **Volume**: `redis_data` (persists data)

### Backend API
- **Container**: `socket-game-backend`
- **Port**: `5000`
- **Hot Reload**: Enabled (code changes auto-reload)
- **Volume**: `./packages/backend` (mounted for development)

### Frontend
- **Container**: `socket-game-frontend`
- **Port**: `5173`
- **Hot Reload**: Enabled (code changes auto-reload)
- **Volume**: `./packages/frontend` (mounted for development)

## Useful Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Execute Commands in Containers
```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U postgres -d socket_game
```

### Rebuild After Code Changes
```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all services
docker-compose build
docker-compose up -d
```

## Environment Variables

### Backend Environment Variables

Set these in `docker-compose.yml` or via `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `5000` |
| `DATABASE_URL` | PostgreSQL connection | Auto-configured |
| `REDIS_URL` | Redis connection | Auto-configured |
| `JWT_SECRET` | JWT signing secret | Required |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Required |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:5000` |

## Troubleshooting

### Port Already in Use

If ports 5000, 5173, 5432, or 6379 are already in use:

1. Stop the conflicting service
2. Or change ports in `docker-compose.yml`:
   ```yaml
   ports:
     - '5001:5000'  # Change host port
   ```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec backend npm run db:test
```

### Redis Connection Issues

```bash
# Check Redis health
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli -a redis123 ping
```

### Rebuild Everything

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose rm -f

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### View Container Status

```bash
# List all containers
docker-compose ps

# Check resource usage
docker stats
```

## Production Deployment

For production, use the production Dockerfiles:

```bash
# Build production images
docker build -f docker/Dockerfile.backend -t cube-game-backend ./packages/backend
docker build -f docker/Dockerfile.frontend -t cube-game-frontend ./packages/frontend
```

## Development vs Production

### Development (Current Setup)
- Hot reload enabled
- Source code mounted as volumes
- Development dependencies included
- Debug logging enabled

### Production
- Optimized builds
- No source code volumes
- Production dependencies only
- Nginx for frontend serving

## Next Steps

1. **Set up Google OAuth** - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `docker-compose.yml`
2. **Run migrations** - Execute `docker-compose exec backend npm run db:migrate`
3. **Access the app** - Open http://localhost:5173
4. **Check logs** - Monitor with `docker-compose logs -f`

## Notes

- Data persists in Docker volumes (`postgres_data`, `redis_data`)
- Code changes are reflected immediately (hot reload)
- To reset database: `docker-compose exec backend npm run db:migrate` (after dropping tables)
- Backend runs on port 5000 (not 3000) to match your local setup

