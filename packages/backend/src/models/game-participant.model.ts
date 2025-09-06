export interface GameParticipant {
  game_id: string;
  user_id: string;
  color: string;
  cells_owned: number;
  is_active: boolean;
  is_ready: boolean;
  joined_at: Date;
  left_at?: Date;
}

export interface CreateGameParticipantDTO {
  game_id: string;
  user_id: string;
  color: string;
  is_ready?: boolean;
}

export interface UpdateGameParticipantDTO {
  cells_owned?: number;
  is_active?: boolean;
  is_ready?: boolean;
  left_at?: Date;
}