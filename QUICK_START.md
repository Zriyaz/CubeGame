# Quick Start Guide - CubeGame

## 🐳 Option 1: Using Docker (Recommended)

### Step 1: Start Docker Desktop
Make sure Docker Desktop is running on your Mac:
- Open **Docker Desktop** application
- Wait for it to fully start (whale icon in menu bar should be steady)
- Verify Docker is running:
  ```bash
  docker info
  ```

### Step 2: Start PostgreSQL and Redis
```bash
docker-compose up -d postgres redis
```

### Step 3: Verify Services
```bash
docker ps
```
You should see `socket-game-postgres` and `socket-game-redis` containers running.

### Step 4: Set Up Environment Variables
Create `packages/backend/.env`:
```env
NODE_ENV=development
PORT=5000

# Database (matches docker-compose.yml)
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/socket_game

# Redis (matches docker-compose.yml)
REDIS_URL=redis://:redis123@localhost:6379

# JWT Secrets (change these!)
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-change-in-production

# Google OAuth (get from Google Cloud Console - see GOOGLE_OAUTH_SETUP.md)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 5: Run Database Migrations
```bash
npm run db:migrate
```

### Step 6: Start Development Servers
```bash
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:5173

---

## 💻 Option 2: Local PostgreSQL & Redis (No Docker)

### Step 1: Install PostgreSQL
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or use Postgres.app from https://postgresapp.com/
```

### Step 2: Install Redis
```bash
# Using Homebrew
brew install redis
brew services start redis

# Or run manually
redis-server
```

### Step 3: Create Database
```bash
createdb socket_game_dev
# Or using psql:
# psql -U postgres -c "CREATE DATABASE socket_game_dev;"
```

### Step 4: Set Up Environment Variables
Create `packages/backend/.env`:
```env
NODE_ENV=development
PORT=5000

# Database (adjust credentials as needed)
DATABASE_URL=postgresql://postgres@localhost:5432/socket_game_dev

# Redis (no password for local)
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-change-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 5: Install Dependencies & Run Migrations
```bash
npm install
npm run db:migrate
```

### Step 6: Start Development Servers
```bash
npm run dev
```

---

## 🔧 Troubleshooting

### Docker Issues

**"Cannot connect to the Docker daemon"**
- Start Docker Desktop application
- Wait for it to fully initialize
- Check status: `docker info`

**"Port already in use"**
- Stop existing containers: `docker-compose down`
- Or change ports in `docker-compose.yml`

### Database Issues

**"Database connection failed"**
- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` in `.env` matches your setup
- Ensure database exists: `psql -l` (should list `socket_game` or `socket_game_dev`)

**"Migration failed"**
- Ensure database exists
- Check database user has proper permissions
- Try: `npm run db:migrate` from `packages/backend` directory

### Redis Issues

**"Redis connection failed"**
- Verify Redis is running: `redis-cli ping` (should return `PONG`)
- Check `REDIS_URL` in `.env`
- For Docker Redis with password: `redis://:redis123@localhost:6379`
- For local Redis: `redis://localhost:6379`

### Port Conflicts

If ports 5000, 5173, 5432, or 6379 are already in use:

1. **Backend port (5000)**: Change `PORT` in `packages/backend/.env`
2. **Frontend port (5173)**: Vite will auto-increment, or set in `packages/frontend/vite.config.ts`
3. **PostgreSQL (5432)**: Change in `docker-compose.yml` or PostgreSQL config
4. **Redis (6379)**: Change in `docker-compose.yml` or Redis config

---

## ✅ Verify Everything is Working

1. **Check Docker containers** (if using Docker):
   ```bash
   docker ps
   ```

2. **Check PostgreSQL**:
   ```bash
   psql -U postgres -d socket_game -c "SELECT 1;"
   ```

3. **Check Redis**:
   ```bash
   redis-cli ping
   ```

4. **Check Backend Health**:
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

5. **Open Frontend**:
   Navigate to http://localhost:5173

---

## 🎯 Next Steps

1. **Set up Google OAuth** (required for authentication):
   - Follow instructions in `GOOGLE_OAUTH_SETUP.md`
   - Add credentials to `packages/backend/.env`

2. **Start Playing**:
   - Open http://localhost:5173
   - Sign in with Google
   - Create or join a game!

---

## 📚 Need More Help?

- See `CODEBASE_EXPLORATION.md` for detailed architecture overview
- See `GOOGLE_OAUTH_SETUP.md` for OAuth configuration
- See `docs/` folder for technical documentation

