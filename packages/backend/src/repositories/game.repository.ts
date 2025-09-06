import { Pool } from 'pg';
import { Game, CreateGameDTO, UpdateGameDTO, GameStatus } from '../models/game.model';
import { getPool } from '../config/database';

export class GameRepository {
  private get pool(): Pool {
    return getPool();
  }

  async create(gameData: CreateGameDTO): Promise<Game> {
    const { creator_id, name, board_size, max_players } = gameData;
    
    const query = `
      INSERT INTO games (creator_id, name, board_size, max_players)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [creator_id, name, board_size, max_players || 4];
    const result = await this.pool.query<Game>(query, values);
    
    return result.rows[0];
  }

  async findById(id: string): Promise<Game | null> {
    const query = 'SELECT * FROM games WHERE id = $1';
    const result = await this.pool.query<Game>(query, [id]);
    
    return result.rows[0] || null;
  }

  async findByInviteCode(inviteCode: string): Promise<Game | null> {
    const query = 'SELECT * FROM games WHERE invite_code = $1';
    const result = await this.pool.query<Game>(query, [inviteCode]);
    
    return result.rows[0] || null;
  }

  async findByStatus(status: GameStatus, limit: number = 20): Promise<Game[]> {
    const query = `
      SELECT * FROM games 
      WHERE status = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await this.pool.query<Game>(query, [status, limit]);
    
    return result.rows;
  }

  async findByCreator(creatorId: string): Promise<Game[]> {
    const query = `
      SELECT * FROM games 
      WHERE creator_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query<Game>(query, [creatorId]);
    
    return result.rows;
  }

  async findUserGames(userId: string, status?: GameStatus): Promise<Game[]> {
    let query = `
      SELECT DISTINCT g.* 
      FROM games g
      LEFT JOIN game_participants gp ON g.id = gp.game_id
      WHERE g.creator_id = $1 OR gp.user_id = $1
    `;
    
    const values: any[] = [userId];
    
    if (status) {
      query += ' AND g.status = $2';
      values.push(status);
    }
    
    query += ' ORDER BY g.created_at DESC';
    
    const result = await this.pool.query<Game>(query, values);
    return result.rows;
  }

  async update(id: string, updates: UpdateGameDTO): Promise<Game | null> {
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
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE games 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query<Game>(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM games WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    return (result.rowCount || 0) > 0;
  }

  async getGameWithParticipants(id: string): Promise<any | null> {
    const query = `
      SELECT 
        g.*,
        json_agg(
          json_build_object(
            'user_id', gp.user_id,
            'color', gp.color,
            'cells_owned', gp.cells_owned,
            'is_active', gp.is_active,
            'is_ready', gp.is_ready,
            'joined_at', gp.joined_at,
            'user', json_build_object(
              'id', u.id,
              'name', u.name,
              'avatar_url', u.avatar_url
            )
          )
        ) FILTER (WHERE gp.user_id IS NOT NULL) as participants
      FROM games g
      LEFT JOIN game_participants gp ON g.id = gp.game_id
      LEFT JOIN users u ON gp.user_id = u.id
      WHERE g.id = $1
      GROUP BY g.id
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }
}