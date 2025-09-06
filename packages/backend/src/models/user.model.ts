export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  preferred_color: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface UpdateUserDTO {
  name?: string;
  avatar_url?: string;
  preferred_color?: string;
}