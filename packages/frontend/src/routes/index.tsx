import { FRONTEND_ROUTES } from '@socket-game/shared';

export const routes = {
  // Public routes
  landing: FRONTEND_ROUTES.HOME,
  login: FRONTEND_ROUTES.LOGIN,
  
  // Protected routes
  dashboard: FRONTEND_ROUTES.DASHBOARD,
  profile: FRONTEND_ROUTES.PROFILE,
  settings: FRONTEND_ROUTES.SETTINGS,
  
  // Game routes
  createGame: '/game/create',
  joinGame: '/game/join/:code?',
  gameRoom: FRONTEND_ROUTES.GAME,
  gameActive: '/game/:gameId/play',
  gameResults: '/game/:gameId/results',
  
  // History & stats
  history: FRONTEND_ROUTES.GAME_HISTORY,
  leaderboard: FRONTEND_ROUTES.LEADERBOARD,
  
  // Legal
  privacy: '/privacy',
  terms: '/terms',
} as const;

export type RoutePath = typeof routes[keyof typeof routes];