import { Pool } from 'pg';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/user.model';
import { getPool } from '../config/database';

export class UserRepository {
  private get pool(): Pool {
    return getPool();
  }

  async create(userData: CreateUserDTO): Promise<User> {
    const { googleId, email, name, avatarUrl } = userData;
    
    const query = `
      INSERT INTO users (google_id, email, name, avatar_url, preferred_color)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [googleId, email, name, avatarUrl, '#00FFCC'];
    const result = await this.pool.query<User>(query, values);
    
    return result.rows[0];
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query<User>(query, [id]);
    
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query<User>(query, [email]);
    
    return result.rows[0] || null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await this.pool.query<User>(query, [googleId]);
    
    return result.rows[0] || null;
  }

  async update(id: string, updates: UpdateUserDTO): Promise<User | null> {
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
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query<User>(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    return (result.rowCount || 0) > 0;
  }

  async getUserStatistics(userId: string): Promise<any> {
    const query = 'SELECT * FROM v_user_stats WHERE id = $1';
    const result = await this.pool.query(query, [userId]);
    
    return result.rows[0] || null;
  }

  async searchUsers(searchQuery: string): Promise<User[]> {
    const query = `
      SELECT * FROM users 
      WHERE name ILIKE $1 OR email ILIKE $1
      ORDER BY name
      LIMIT 20
    `;
    const result = await this.pool.query<User>(query, [`%${searchQuery}%`]);
    
    return result.rows;
  }
}

// Create a singleton instance
const userRepository = new UserRepository();

// Export both the class and the singleton instance
export default userRepository;