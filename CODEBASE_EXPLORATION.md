# CubeGame - Codebase Exploration & Run Guide

## 📋 Project Overview

**CubeGame** is a real-time multiplayer grid-based strategy game where players compete to claim territory on a shared board. The game features:

- 🎮 Real-time multiplayer gameplay via WebSockets
- 🔐 Google OAuth authentication
- 💬 In-game chat functionality
- 🏆 Leaderboards and game statistics
- 🎨 Customizable player colors
- 📱 Responsive design
- 🔊 Sound effects (Web Audio API)
- ⚡ WebSocket-based real-time updates

## 🏗️ Architecture

### Monorepo Structure
```
CubeGame/
├── packages/
│   ├── backend/        # Express + Socket.io server
│   ├── frontend/       # React + Vite application
│   └── shared/         # Shared TypeScript types & constants
├── docker/             # Docker configurations
├── docs/               # Technical documentation
└── scripts/            # Setup scripts
```

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite for bundling
- Tamagui for UI components
- React Query for server state
- Zustand for client state
- Socket.io client for WebSocket

**Backend:**
- Node.js with Express
- TypeScript
- Socket.io for WebSocket server
- PostgreSQL for persistence
- Redis for caching & sessions
- Google OAuth 2.0

**Infrastructure:**
- Docker & Docker Compose
- Kubernetes configs (in k8s/)
- Nginx for reverse proxy

## 🗂️ Key Components

### Backend Structure (`packages/backend/src/`)
- **`index.ts`** - Main server entry point
- **`config/`** - Database, Redis, Passport configurations
- **`controllers/`** - REST API controllers (auth, game, user, leaderboard, notifications)
- **`services/`** - Business logic layer
- **`repositories/`** - Data access layer
- **`models/`** - Data models
- **`routes/`** - Express route definitions
- **`websockets/`** - Socket.io handlers for real-time game events
- **`middleware/`** - Auth, error handling, validation
- **`migrations/`** - Database migration scripts

### Frontend Structure (`packages/frontend/src/`)
- **`main.tsx`** - React app entry point
- **`App.tsx`** - Main app component
- **`pages/`** - Route pages (auth, game, lobby, leaderboard, profile, settings)
- **`components/`** - Reusable UI components
- **`hooks/`** - Custom React hooks
- **`stores/`** - Zustand state management
- **`contexts/`** - React contexts (SocketContext)
- **`lib/`** - API clients and utilities
- **`routes/`** - React Router configuration

### Shared Package (`packages/shared/`)
- Type definitions for game, user, notifications, websockets
- Shared constants
- Utility functions

## 🚀 How to Run the Application

### Prerequisites
- **Node.js** v16+ (v18+ recommended)
- **PostgreSQL** 15+
- **Redis** 7+
- **Google OAuth credentials** (see `GOOGLE_OAUTH_SETUP.md`)

### Option 1: Local Development (Recommended for Development)

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Set Up Environment Variables

Create `packages/backend/.env`:
```env
NODE_ENV=development
PORT=5000

# Database (adjust credentials as needed)
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/socket_game_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (use strong random strings in production)
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-change-in-production

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Step 3: Start PostgreSQL & Redis

**Using Docker (Easiest):**
```bash
docker-compose up -d postgres redis
```

**Or manually:**
- Start PostgreSQL: `postgres` (or via your system service)
- Start Redis: `redis-server`

#### Step 4: Create Database
```bash
createdb socket_game_dev
# Or using psql:
# psql -U postgres -c "CREATE DATABASE socket_game_dev;"
```

#### Step 5: Run Database Migrations
```bash
npm run db:migrate
# Or:
# cd packages/backend && npm run db:migrate
```

#### Step 6: Start Development Servers

**Option A: Run both together (from root)**
```bash
npm run dev
```

**Option B: Run separately (in different terminals)**

Terminal 1 - Backend:
```bash
cd packages/backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd packages/frontend
npm run dev
```

#### Step 7: Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

### Option 2: Docker Compose (Easiest for Quick Start)

#### Step 1: Set Up Environment

Create `packages/backend/.env` with the same variables as above, but adjust URLs for Docker networking:
```env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/socket_game
REDIS_URL=redis://:redis123@redis:6379
```

#### Step 2: Start All Services
```bash
docker-compose up
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend (port 3000)
- Frontend (port 5173)

#### Step 3: Run Migrations (in a separate terminal)
```bash
docker-compose exec backend npm run db:migrate
```

#### Step 4: Access the Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

---

### Option 3: Using Setup Script

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Then start the dev servers:
```bash
npm run dev
```

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend concurrently
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run test` - Run tests across all packages
- `npm run db:migrate` - Run database migrations
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

### Backend (`packages/backend/`)
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run build` - Compile TypeScript
- `npm run start` - Run production build
- `npm run db:migrate` - Run migrations
- `npm run test` - Run Jest tests

### Frontend (`packages/frontend/`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎮 Game Flow

1. **Authentication**: User signs in with Google OAuth
2. **Lobby**: User can create or join games
3. **Game Setup**: Creator invites players, configures board size (4x4 to 16x16)
4. **Gameplay**: Players take turns claiming cells on the grid
5. **Victory**: Player with most cells when board is full wins
6. **Leaderboard**: Stats tracked and displayed

## 📡 WebSocket Events

The game uses Socket.io for real-time communication:

**Client → Server:**
- `join_game` - Join a game room
- `make_move` - Claim a cell
- `send_message` - Chat message
- `player_ready` - Mark player as ready

**Server → Client:**
- `game_state` - Game state updates
- `move_made` - Move confirmation
- `player_joined` - New player notification
- `game_started` - Game start signal
- `game_ended` - Game completion

## 🗄️ Database Schema

**PostgreSQL Tables:**
- `users` - User accounts and profiles
- `games` - Game records
- `game_participants` - Player-game relationships
- `moves` - Move history
- `notifications` - User notifications

**Redis Usage:**
- Active game states (for fast access)
- User sessions
- Leaderboard caching
- Pub/Sub for real-time events

## 🔐 Authentication Flow

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. Google redirects back to `/api/auth/google/callback`
4. Backend creates/updates user, generates JWT tokens
5. Tokens stored in HTTP-only cookies
6. Frontend receives auth state via Socket.io connection

## 📝 Important Notes

1. **Google OAuth Setup**: Follow `GOOGLE_OAUTH_SETUP.md` to configure OAuth credentials
2. **Database**: Ensure PostgreSQL is running before starting backend
3. **Redis**: Required for sessions and real-time features
4. **Ports**: 
   - Backend: 5000 (local) or 3000 (Docker)
   - Frontend: 5173
   - PostgreSQL: 5432
   - Redis: 6379
5. **CORS**: Configured for `http://localhost:5173` by default

## 🐛 Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists: `createdb socket_game_dev`

### Redis Connection Failed
- Ensure Redis is running: `redis-server`
- Check `REDIS_URL` in `.env`
- For Docker Redis: `redis://:redis123@redis:6379`

### OAuth Errors
- Verify Google OAuth credentials in `.env`
- Check redirect URI matches exactly: `http://localhost:5000/api/auth/google/callback`
- Ensure OAuth consent screen is configured

### Port Already in Use
- Change `PORT` in backend `.env`
- Update `FRONTEND_URL` if backend port changes
- Update frontend API URL if needed

## 📚 Additional Documentation

- `docs/API_DOCUMENTATION.md` - REST API reference
- `docs/WEBSOCKET_PROTOCOL.md` - WebSocket event documentation
- `docs/DATABASE_DESIGN.md` - Database schema details
- `docs/UI_UX_DESIGN_SYSTEM.md` - Frontend design guidelines
- `GOOGLE_OAUTH_SETUP.md` - OAuth setup guide
- `DEPLOYMENT_GUIDE.md` - Production deployment instructions

## 🎯 Next Steps

1. Set up Google OAuth credentials
2. Configure environment variables
3. Start PostgreSQL and Redis
4. Run migrations
5. Start development servers
6. Open http://localhost:5173 and start playing!

