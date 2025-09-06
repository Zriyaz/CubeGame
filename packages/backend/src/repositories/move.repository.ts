import { Pool } from 'pg';
import { Move, CreateMoveDTO } from '../models/move.model';
import { getPool } from '../config/database';

export class MoveRepository {
  private get pool(): Pool {
    return getPool();
  }

  async create(moveData: CreateMoveDTO): Promise<Move> {
    const { game_id, user_id, cell_x, cell_y } = moveData;
    
    const query = `
      INSERT INTO moves (game_id, user_id, cell_x, cell_y)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [game_id, user_id, cell_x, cell_y];
    const result = await this.pool.query<Move>(query, values);
    
    return result.rows[0];
  }

  async findByGame(gameId: string): Promise<Move[]> {
    const query = `
      SELECT m.*, u.name as user_name
      FROM moves m
      JOIN users u ON m.user_id = u.id
      WHERE m.game_id = $1
      ORDER BY m.timestamp ASC
    `;
    const result = await this.pool.query<Move>(query, [gameId]);
    
    return result.rows;
  }

  async findByGameAndUser(gameId: string, userId: string): Promise<Move[]> {
    const query = `
      SELECT * FROM moves
      WHERE game_id = $1 AND user_id = $2
      ORDER BY timestamp ASC
    `;
    const result = await this.pool.query<Move>(query, [gameId, userId]);
    
    return result.rows;
  }

  async countByGame(gameId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM moves WHERE game_id = $1';
    const result = await this.pool.query(query, [gameId]);
    
    return parseInt(result.rows[0].count);
  }

  async getLastMove(gameId: string): Promise<Move | null> {
    const query = `
      SELECT * FROM moves
      WHERE game_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    const result = await this.pool.query<Move>(query, [gameId]);
    
    return result.rows[0] || null;
  }

  async checkCellTaken(gameId: string, cellX: number, cellY: number): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM moves
        WHERE game_id = $1 AND cell_x = $2 AND cell_y = $3
      )
    `;
    const result = await this.pool.query(query, [gameId, cellX, cellY]);
    
    return result.rows[0].exists;
  }
}