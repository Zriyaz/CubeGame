// Client -> Server Events
export interface ClientToServerEvents {
  authenticate: (data: { token: string }) => void;
  'game:join': (data: { gameId: string }) => void;
  'game:leave': (data: { gameId: string }) => void;
  'game:click_cell': (data: { gameId: string; x: number; y: number }) => void;
  'game:subscribe': (data: { gameId: string }) => void;
  'game:unsubscribe': (data: { gameId: string }) => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  authenticated: (data: { userId: string; sessionId: string }) => void;
  error: (data: { code: string; message: string; details?: any }) => void;
  'game:state': (data: GameStateUpdate) => void;
  'game:created': (data: { gameId: string; inviteCode: string }) => void;
  'game:joined': (data: { gameId: string; color: string }) => void;
  'game:started': (data: { gameId: string; firstPlayer?: string }) => void;
  'game:ended': (data: GameEndedEvent) => void;
  'game:player_joined': (data: PlayerJoinedEvent) => void;
  'game:player_left': (data: { userId: string }) => void;
  'game:player_disconnected': (data: { userId: string }) => void;
  'game:player_reconnected': (data: { userId: string }) => void;
  'game:cell_claimed': (data: CellClaimedEvent) => void;
  'game:cell_failed': (data: CellFailedEvent) => void;
  'game:batch_update': (data: { updates: CellUpdate[] }) => void;
  'game:board_sync': (data: { board: (string | null)[][] }) => void;
}

// Event Data Types
export interface GameStateUpdate {
  gameId: string;
  state: any; // GameState from game.types
  timestamp: number;
}

export interface GameEndedEvent {
  gameId: string;
  winner: any; // Player from game.types
  scores: Record<string, number>;
  duration: number;
}

export interface PlayerJoinedEvent {
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  color: string;
}

export interface CellClaimedEvent {
  x: number;
  y: number;
  userId: string;
  color: string;
  timestamp: number;
}

export interface CellFailedEvent {
  x: number;
  y: number;
  reason: 'cell_taken' | 'invalid_position' | 'not_your_turn' | 'game_not_started';
  timestamp: number;
}

export interface CellUpdate {
  x: number;
  y: number;
  userId: string;
  color: string;
  timestamp: number;
}

// Socket Data
export interface SocketData {
  userId: string;
  gameId?: string;
}

// Error Codes
export enum ErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  GAME_FULL = 'GAME_FULL',
  NOT_IN_GAME = 'NOT_IN_GAME',
  CELL_TAKEN = 'CELL_TAKEN',
  INVALID_MOVE = 'INVALID_MOVE',
  GAME_NOT_STARTED = 'GAME_NOT_STARTED',
  GAME_ENDED = 'GAME_ENDED',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
}