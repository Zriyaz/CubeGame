export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface Game {
  id: string;
  creator_id: string;
  name: string;
  board_size: number;
  max_players: number;
  status: GameStatus;
  winner_id?: string;
  invite_code: string;
  created_at: Date;
  started_at?: Date;
  ended_at?: Date;
}

export interface CreateGameDTO {
  creator_id: string;
  name: string;
  board_size: number;
  max_players?: number;
}

export interface UpdateGameDTO {
  status?: GameStatus;
  winner_id?: string;
  started_at?: Date;
  ended_at?: Date;
}