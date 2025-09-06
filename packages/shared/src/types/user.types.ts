export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends Omit<User, 'googleId'> {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalCellsClaimed: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}