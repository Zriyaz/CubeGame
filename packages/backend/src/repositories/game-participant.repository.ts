import { Pool } from 'pg';
import { GameParticipant, CreateGameParticipantDTO, UpdateGameParticipantDTO } from '../models/game-participant.model';
import { getPool } from '../config/database';

export class GameParticipantRepository {
  private get pool(): Pool {
    return getPool();
  }

  async create(data: CreateGameParticipantDTO): Promise<GameParticipant> {
    const { game_id, user_id, color, is_ready = false } = data;
    
    const query = `
      INSERT INTO game_participants (game_id, user_id, color, is_ready)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [game_id, user_id, color, is_ready];
    const result = await this.pool.query<GameParticipant>(query, values);
    
    return result.rows[0];
  }

  async findByGameAndUser(gameId: string, userId: string): Promise<GameParticipant | null> {
    const query = 'SELECT * FROM game_participants WHERE game_id = $1 AND user_id = $2';
    const result = await this.pool.query<GameParticipant>(query, [gameId, userId]);
    
    return result.rows[0] || null;
  }

  async findByGame(gameId: string): Promise<GameParticipant[]> {
    const query = `
      SELECT gp.*, u.name, u.avatar_url 
      FROM game_participants gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.game_id = $1
      ORDER BY gp.joined_at
    `;
    const result = await this.pool.query<GameParticipant>(query, [gameId]);
    
    return result.rows;
  }

  async findActiveByGame(gameId: string): Promise<GameParticipant[]> {
    const query = `
      SELECT gp.*, u.name, u.avatar_url 
      FROM game_participants gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.game_id = $1 AND gp.is_active = true
      ORDER BY gp.joined_at
    `;
    const result = await this.pool.query<GameParticipant>(query, [gameId]);
    
    return result.rows;
  }

  async findByUser(userId: string): Promise<GameParticipant[]> {
    const query = `
      SELECT gp.*, g.name as game_name, g.status as game_status
      FROM game_participants gp
      JOIN games g ON gp.game_id = g.id
      WHERE gp.user_id = $1
      ORDER BY gp.joined_at DESC
    `;
    const result = await this.pool.query<GameParticipant>(query, [userId]);
    
    return result.rows;
  }

  async update(gameId: string, userId: string, updates: UpdateGameParticipantDTO): Promise<GameParticipant | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findByGameAndUser(gameId, userId);
    }

    values.push(gameId, userId);
    const query = `
      UPDATE game_participants 
      SET ${fields.join(', ')}
      WHERE game_id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.pool.query<GameParticipant>(query, values);
    return result.rows[0] || null;
  }

  async delete(gameId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM game_participants WHERE game_id = $1 AND user_id = $2';
    const result = await this.pool.query(query, [gameId, userId]);
    
    return (result.rowCount || 0) > 0;
  }

  async countByGame(gameId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM game_participants WHERE game_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [gameId]);
    
    return parseInt(result.rows[0].count);
  }

  async incrementCellsOwned(gameId: string, userId: string, increment: number = 1): Promise<void> {
    const query = `
      UPDATE game_participants 
      SET cells_owned = cells_owned + $3
      WHERE game_id = $1 AND user_id = $2
    `;
    
    await this.pool.query(query, [gameId, userId, increment]);
  }
}