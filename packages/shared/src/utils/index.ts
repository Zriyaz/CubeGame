export function generateGameId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'game_';
  for (let i = 0; i < 9; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function calculateWinRate(gamesPlayed: number, gamesWon: number): number {
  if (gamesPlayed === 0) return 0;
  return Math.round((gamesWon / gamesPlayed) * 100);
}

export function createEmptyBoard(size: number): (string | null)[][] {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

export function countFilledCells(board: (string | null)[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

export function getBoardWinner(board: (string | null)[][]): { winner: string; scores: Record<string, number> } | null {
  const scores: Record<string, number> = {};
  
  for (const row of board) {
    for (const cell of row) {
      if (cell) {
        scores[cell] = (scores[cell] || 0) + 1;
      }
    }
  }
  
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  
  entries.sort((a, b) => b[1] - a[1]);
  
  return {
    winner: entries[0][0],
    scores
  };
}