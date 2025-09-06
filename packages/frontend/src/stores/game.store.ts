import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  GAME_STATUS,
  type GameWithDetails,
  type Player,
  type CellClaimedMessage,
  type WSError,
} from '@socket-game/shared';

interface GameState {
  // Current game data
  currentGame: GameWithDetails | null;
  
  // UI state
  selectedCell: { x: number; y: number } | null;
  isClickingCell: boolean;
  lastError: WSError | null;
  
  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  
  // Actions
  setCurrentGame: (game: GameWithDetails | null) => void;
  updateBoard: (x: number, y: number, userId: string) => void;
  updatePlayer: (userId: string, updates: Partial<Player>) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (userId: string) => void;
  selectCell: (x: number, y: number) => void;
  deselectCell: () => void;
  setClickingCell: (isClicking: boolean) => void;
  setError: (error: WSError | null) => void;
  setConnectionState: (connected: boolean, reconnecting?: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentGame: null,
  selectedCell: null,
  isClickingCell: false,
  lastError: null,
  isConnected: false,
  isReconnecting: false,
};

export const useGameStore = create<GameState>()(
  immer((set) => ({
    ...initialState,

    setCurrentGame: (game) =>
      set((state) => {
        state.currentGame = game;
      }),

    updateBoard: (x, y, userId) =>
      set((state) => {
        if (!state.currentGame) return;
        
        state.currentGame.board[y][x] = userId;
        
        // Update player's cell count
        const player = state.currentGame.players.find(p => p.userId === userId);
        if (player) {
          player.cellsOwned += 1;
        }
      }),

    updatePlayer: (userId, updates) =>
      set((state) => {
        if (!state.currentGame) return;
        
        const playerIndex = state.currentGame.players.findIndex(p => p.userId === userId);
        if (playerIndex !== -1) {
          Object.assign(state.currentGame.players[playerIndex], updates);
        }
      }),

    addPlayer: (player) =>
      set((state) => {
        if (!state.currentGame) return;
        
        const exists = state.currentGame.players.some(p => p.userId === player.userId);
        if (!exists) {
          state.currentGame.players.push(player);
        }
      }),

    removePlayer: (userId) =>
      set((state) => {
        if (!state.currentGame) return;
        
        state.currentGame.players = state.currentGame.players.filter(
          p => p.userId !== userId
        );
      }),

    selectCell: (x, y) =>
      set((state) => {
        state.selectedCell = { x, y };
      }),

    deselectCell: () =>
      set((state) => {
        state.selectedCell = null;
      }),

    setClickingCell: (isClicking) =>
      set((state) => {
        state.isClickingCell = isClicking;
      }),

    setError: (error) =>
      set((state) => {
        state.lastError = error;
      }),

    setConnectionState: (connected, reconnecting = false) =>
      set((state) => {
        state.isConnected = connected;
        state.isReconnecting = reconnecting;
      }),

    reset: () =>
      set(() => initialState),
  }))
);

// Selectors
export const selectCurrentGame = (state: GameState) => state.currentGame;
export const selectIsGameActive = (state: GameState) => 
  state.currentGame?.status === GAME_STATUS.IN_PROGRESS;
export const selectIsGameWaiting = (state: GameState) => 
  state.currentGame?.status === GAME_STATUS.WAITING;
export const selectIsGameCompleted = (state: GameState) => 
  state.currentGame?.status === GAME_STATUS.COMPLETED;
export const selectCurrentPlayer = (userId: string) => (state: GameState) =>
  state.currentGame?.players.find(p => p.userId === userId);
export const selectIsMyTurn = (userId: string) => (state: GameState) => {
  // This is a simplified version - you might want to implement turn logic
  return state.currentGame?.status === GAME_STATUS.IN_PROGRESS;
};
export const selectWinner = (state: GameState) => {
  if (!state.currentGame || state.currentGame.status !== GAME_STATUS.COMPLETED) {
    return null;
  }
  
  // Find player with most cells
  return state.currentGame.players.reduce((winner, player) => 
    player.cellsOwned > (winner?.cellsOwned || 0) ? player : winner
  , null as Player | null);
};