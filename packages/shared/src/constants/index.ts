export const GAME_CONSTANTS = {
  MIN_BOARD_SIZE: 4,
  MAX_BOARD_SIZE: 16,
  DEFAULT_BOARD_SIZE: 8,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  DEFAULT_MAX_PLAYERS: 4,
  INVITE_CODE_LENGTH: 8,
  GAME_NAME_MIN_LENGTH: 3,
  GAME_NAME_MAX_LENGTH: 50,
} as const;

export const COLORS = [
  '#FF5733', // Red
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F5', // Magenta
  '#FFD433', // Yellow
  '#33FFF5', // Cyan
  '#F533FF', // Purple
  '#FF8C33', // Orange
  '#8CFF33', // Lime
  '#338CFF', // Sky Blue
] as const;

export const REDIS_KEYS = {
  GAME_STATE: (gameId: string) => `game:${gameId}:state`,
  GAME_BOARD: (gameId: string) => `game:${gameId}:board`,
  GAME_PLAYERS: (gameId: string) => `game:${gameId}:players`,
  GAME_SCORES: (gameId: string) => `game:${gameId}:scores`,
  USER_SESSION: (userId: string) => `user:${userId}:session`,
  USER_GAMES: (userId: string) => `user:${userId}:games`,
  CELL_LOCK: (gameId: string, x: number, y: number) => `lock:game:${gameId}:cell:${x}:${y}`,
  LEADERBOARD_DAILY: 'leaderboard:daily',
  LEADERBOARD_WEEKLY: 'leaderboard:weekly',
  LEADERBOARD_ALLTIME: 'leaderboard:alltime',
} as const;

export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  CELL_CLICKS_PER_SECOND: 10,
  GAMES_PER_HOUR: 10,
  WEBSOCKET_MESSAGES_PER_SECOND: 50,
} as const;

export const TOKEN_EXPIRY = {
  JWT: '24h',
  REFRESH_TOKEN: '7d',
  SESSION: 86400, // 24 hours in seconds
} as const;