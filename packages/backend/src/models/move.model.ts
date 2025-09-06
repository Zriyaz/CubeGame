export interface Move {
  id: string;
  game_id: string;
  user_id: string;
  cell_x: number;
  cell_y: number;
  timestamp: Date;
}

export interface CreateMoveDTO {
  game_id: string;
  user_id: string;
  cell_x: number;
  cell_y: number;
}