/**
 * Shared type definitions between frontend and backend
 */

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  preferred_color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserStats {
  totalGames: number;
  gamesWon: number;
  winRate: number;
  totalCellsCaptured: number;
  averageCellsPerGame: number;
  longestWinStreak: number;
  currentStreak: number;
  totalPlayTime: number;
  rank: string;
  level: number;
}

// Game Types
export interface Game {
  id: string;
  creator_id: string;
  name: string;
  board_size: number;
  max_players: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  winner_id?: string;
  invite_code: string;
  created_at: Date | string;
  started_at?: Date | string;
  ended_at?: Date | string;
}

export interface GameWithDetails extends Game {
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  players: Player[];
  board: (string | null)[][];
}

export interface GameListItem {
  id: string;
  name: string;
  creatorName: string;
  boardSize: number;
  playerCount: number;
  maxPlayers: number;
  status: Game['status'];
  createdAt: Date | string;
}

// Player Types
export interface Player {
  userId: string;
  name: string;
  color: string;
  cellsOwned: number;
  isOnline: boolean;
  avatarUrl?: string;
}

export interface GameParticipant {
  game_id: string;
  user_id: string;
  color: string;
  cells_owned: number;
  is_active: boolean;
  joined_at: Date | string;
  left_at?: Date | string;
}

// Move Types
export interface Move {
  id: string;
  game_id: string;
  user_id: string;
  cell_x: number;
  cell_y: number;
  timestamp: Date | string;
}

export interface CellUpdate {
  x: number;
  y: number;
  userId: string;
  color: string;
  timestamp: number;
}

// WebSocket Message Types
export interface WSError {
  code: string;
  message: string;
  details?: any;
  timestamp?: number;
}

export interface AuthenticatedMessage {
  userId: string;
  sessionId: string;
}

export interface GameStateMessage {
  game: GameWithDetails;
}

export interface GameCreatedMessage {
  gameId: string;
  inviteCode: string;
}

export interface GameJoinedMessage {
  gameId: string;
  status: string;
  assignedColor: string;
}

export interface GameStartedMessage {
  gameId: string;
  startedAt: Date | string;
}

export interface GameEndedMessage {
  winner: {
    id: string;
    name: string;
  };
  scores: Record<string, number>;
  timestamp: number;
}

export interface PlayerJoinedMessage {
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  color: string;
}

export interface PlayerLeftMessage {
  userId: string;
}

export interface PlayerDisconnectedMessage {
  userId: string;
  timestamp: number;
}

export interface CellClaimedMessage {
  x: number;
  y: number;
  userId: string;
  color: string;
  timestamp: number;
}

export interface CellFailedMessage {
  x: number;
  y: number;
  reason: string;
}

export interface ChatMessage {
  gameId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface PlayerReadyStateMessage {
  gameId: string;
  userId: string;
  isReady: boolean;
}

export interface BatchUpdateMessage {
  updates: CellUpdate[];
  timestamp: number;
}

// API Request/Response Types
export interface CreateGameRequest {
  name: string;
  boardSize: number;
  maxPlayers?: number;
}

export interface JoinGameRequest {
  inviteCode?: string;
  color?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
  preferred_color?: string;
}

export interface ListGamesRequest {
  status?: Game['status'];
  limit?: number;
  offset?: number;
  myGames?: boolean;
}

export interface ListGamesResponse {
  games: GameListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
    timestamp?: string;
  };
}

// Auth Types
export interface AuthResponse {
  user: User;
  token?: string;
}

export interface LoginResponse extends AuthResponse {
  message: string;
}

// Socket Types
export interface SocketAuth {
  token: string;
}

export interface SocketError extends Error {
  code?: string;
  data?: any;
}