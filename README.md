# CubeGame

A real-time multiplayer grid-based strategy game where players compete to claim territory on a shared board.

## Features

- 🎮 Real-time multiplayer gameplay
- 🔐 Google OAuth authentication
- 💬 In-game chat functionality
- 🏆 Leaderboards and game statistics
- 🎨 Customizable player colors
- 📱 Responsive design
- 🔊 Sound effects (Web Audio API)
- ⚡ WebSocket-based real-time updates

## Tech Stack

### Frontend
- React with TypeScript
- Vite for bundling
- Tamagui for UI components
- React Query for server state management
- Zustand for client state management
- Socket.io client for WebSocket communication

### Backend
- Node.js with Express
- TypeScript
- Socket.io for WebSocket server
- PostgreSQL for data persistence
- Redis for caching and session management
- Google OAuth 2.0 for authentication

### Shared
- Monorepo structure with npm workspaces
- Shared types and constants package

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Redis
- Google OAuth credentials

## Installation

1. Clone the repository
```bash
git clone https://github.com/Zriyaz/CubeGame.git
cd CubeGame
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create `.env` files in the backend package:

```bash
# packages/backend/.env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/socket_game_dev

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

4. Set up the database
```bash
cd packages/backend
npm run db:migrate
```

5. Start the development servers

In separate terminals:

```bash
# Backend
cd packages/backend
npm run dev

# Frontend
cd packages/frontend
npm run dev
```

## Game Rules

1. Players take turns claiming cells on a grid
2. Click on empty cells to claim them with your color
3. The player with the most cells when the board is full wins
4. Games can have 2-4 players
5. Players can chat during the game

## Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build all packages
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
socket_game/
├── packages/
│   ├── backend/        # Express server
│   ├── frontend/       # React application
│   └── shared/         # Shared types and constants
├── package.json        # Root package.json
└── README.md          # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with ❤️ using React, Node.js, and TypeScript
- Special thanks to all contributors
