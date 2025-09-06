/**
 * Shared constants between frontend and backend
 */

// WebSocket Events - Client to Server
export const WS_CLIENT_EVENTS = {
  // Authentication
  AUTHENTICATE: 'authenticate',
  REAUTHENTICATE: 'reauthenticate',
  
  // Game Management
  GAME_CREATE: 'game:create',
  GAME_JOIN: 'game:join',
  GAME_LEAVE: 'game:leave',
  GAME_START: 'game:start',
  GAME_SUBSCRIBE: 'game:subscribe',
  GAME_UNSUBSCRIBE: 'game:unsubscribe',
  GAME_RECONNECT: 'game:reconnect',
  GAME_FORFEIT: 'game:forfeit',
  
  // Gameplay
  GAME_CLICK_CELL: 'game:click_cell',
  GAME_BATCH_MOVES: 'game:batch_moves',
  
  // Communication
  CHAT_MESSAGE: 'chat:message',
  PLAYER_EMOJI: 'player:emoji',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  
  // Player State
  PLAYER_READY: 'player:ready',
  PLAYER_NOT_READY: 'player:not_ready',
} as const;

// WebSocket Events - Server to Client
export const WS_SERVER_EVENTS = {
  // Connection
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
  RECONNECTED: 'reconnected',
  RATE_LIMITED: 'rate_limited',
  
  // Game State
  GAME_STATE: 'game:state',
  GAME_CREATED: 'game:created',
  GAME_JOINED: 'game:joined',
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  
  // Player Events
  GAME_PLAYER_JOINED: 'game:player_joined',
  GAME_PLAYER_LEFT: 'game:player_left',
  GAME_PLAYER_DISCONNECTED: 'game:player_disconnected',
  GAME_PLAYER_RECONNECTED: 'game:player_reconnected',
  GAME_PLAYER_INACTIVE: 'game:player_inactive',
  
  // Cell Updates
  GAME_CELL_CLAIMED: 'game:cell_claimed',
  GAME_CELL_FAILED: 'game:cell_failed',
  GAME_BATCH_UPDATE: 'game:batch_update',
  GAME_BOARD_SYNC: 'game:board_sync',
  
  // Chat
  CHAT_MESSAGE: 'chat:message',
  
  // Player State
  PLAYER_READY_STATE: 'player:ready_state',
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication
  AUTH_FAILED: 'AUTH_FAILED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Game Errors
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  GAME_FULL: 'GAME_FULL',
  NOT_IN_GAME: 'NOT_IN_GAME',
  CELL_TAKEN: 'CELL_TAKEN',
  INVALID_MOVE: 'INVALID_MOVE',
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  GAME_ENDED: 'GAME_ENDED',
  
  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server Errors
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Permission Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Resource Errors
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
} as const;

// Game Status
export const GAME_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type GameStatus = typeof GAME_STATUS[keyof typeof GAME_STATUS];

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_GOOGLE: '/api/auth/google',
  AUTH_CALLBACK: '/api/auth/google/callback',
  AUTH_ME: '/api/auth/me',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
  
  // Games
  GAMES: '/api/games',
  GAME_BY_ID: '/api/games/:gameId',
  GAME_JOIN: '/api/games/:gameId/join',
  GAME_START: '/api/games/:gameId/start',
  GAME_LEAVE: '/api/games/:gameId/leave',
  GAME_INVITE: '/api/games/:gameId/invite',
  
  // Users
  USERS_PROFILE: '/api/users/profile',
  USERS_SEARCH: '/api/users/search',
  USERS_ACTIVE: '/api/users/active',
  USER_BY_ID: '/api/users/:userId',
  USER_STATS: '/api/users/:userId/stats',
  
  // Leaderboard
  LEADERBOARD: '/api/leaderboard',
} as const;

// Game Configuration
export const GAME_CONFIG = {
  MIN_BOARD_SIZE: 4,
  MAX_BOARD_SIZE: 16,
  DEFAULT_BOARD_SIZE: 8,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  DEFAULT_MAX_PLAYERS: 4,
  INVITE_CODE_LENGTH: 8,
  DISCONNECT_GRACE_PERIOD: 30000, // 30 seconds
  GAME_CACHE_TTL: 300, // 5 minutes
  BOARD_CACHE_TTL: 86400, // 24 hours
} as const;

// Player Colors
export const PLAYER_COLORS = [
  '#FF5733', // Red-Orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F5', // Magenta
  '#FFFF33', // Yellow
  '#33FFFF', // Cyan
  '#FF8C00', // Dark Orange
  '#8A2BE2', // Blue Violet
  '#FF1493', // Deep Pink
  '#00CED1', // Dark Turquoise
] as const;

// Rate Limits
export const RATE_LIMITS = {
  API_REQUESTS: { window: 60000, max: 100 }, // 100 requests per minute
  CELL_CLICKS: { window: 1000, max: 10 }, // 10 clicks per second
  GAME_CREATION: { window: 3600000, max: 10 }, // 10 games per hour
  WS_MESSAGES: { window: 1000, max: 50 }, // 50 messages per second
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER: 'user:',
  USER_STATS: 'user_stats:',
  GAME: 'game:',
  GAME_BOARD: 'game_board:',
  GAME_MOVES: 'game_moves:',
} as const;

// Room Prefixes
export const ROOM_PREFIXES = {
  USER: 'user:',
  GAME: 'game:',
  GAME_SPECTATORS: 'game_spectators:',
  LOBBY: 'lobby',
} as const;

// Validation Rules
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 2,
  USERNAME_MAX_LENGTH: 30,
  GAME_NAME_MIN_LENGTH: 3,
  GAME_NAME_MAX_LENGTH: 50,
  COLOR_PATTERN: /^#[0-9A-Fa-f]{6}$/,
  INVITE_CODE_PATTERN: /^[A-Z0-9]{8}$/,
} as const;

// Time Constants
export const TIME_CONSTANTS = {
  JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  SESSION_TIMEOUT: 86400000, // 24 hours in ms
  MOVE_TIMEOUT: 30000, // 30 seconds
  RECONNECT_TIMEOUT: 5000, // 5 seconds
} as const;

// Frontend Routes
export const FRONTEND_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  GAME: '/game/:gameId',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LEADERBOARD: '/leaderboard',
  GAME_HISTORY: '/history',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// User Ranks
export const USER_RANKS = {
  BEGINNER: 'Beginner',
  NOVICE: 'Novice',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
  MASTER: 'Master',
  GRANDMASTER: 'Grandmaster',
} as const;

// Achievement Types (for future implementation)
export const ACHIEVEMENT_TYPES = {
  FIRST_WIN: 'first_win',
  WIN_STREAK: 'win_streak',
  CELLS_CAPTURED: 'cells_captured',
  GAMES_PLAYED: 'games_played',
  PERFECT_GAME: 'perfect_game',
  COMEBACK_VICTORY: 'comeback_victory',
} as const;

// Export type utilities
export type WSClientEvent = typeof WS_CLIENT_EVENTS[keyof typeof WS_CLIENT_EVENTS];
export type WSServerEvent = typeof WS_SERVER_EVENTS[keyof typeof WS_SERVER_EVENTS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type UserRank = typeof USER_RANKS[keyof typeof USER_RANKS];