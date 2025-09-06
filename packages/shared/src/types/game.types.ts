export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface Game {
  id: string;
  creatorId: string;
  name: string;
  boardSize: number;
  maxPlayers: number;
  status: GameStatus;
  winnerId?: string;
  inviteCode: string;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface GameParticipant {
  gameId: string;
  userId: string;
  color: string;
  cellsOwned: number;
  isActive: boolean;
  joinedAt: Date;
}

export interface GameState {
  id: string;
  name: string;
  boardSize: number;
  status: GameStatus;
  players: Player[];
  board: (string | null)[][];
  currentTurn?: string;
  timeRemaining?: number;
  createdAt: number;
  startedAt?: number;
}

export interface Player {
  userId: string;
  name: string;
  avatarUrl?: string;
  color: string;
  cellsOwned: number;
  isActive: boolean;
  isOnline: boolean;
  joinedAt: number;
}

export interface CellPosition {
  x: number;
  y: number;
}

export interface CellClaim extends CellPosition {
  userId: string;
  color: string;
  timestamp?: number;
}

export interface Move {
  id?: string;
  gameId: string;
  userId: string;
  cellX: number;
  cellY: number;
  timestamp: Date;
}

export interface GameResult {
  gameId: string;
  winner: Player;
  scores: Record<string, number>;
  duration: number;
  totalMoves: number;
}