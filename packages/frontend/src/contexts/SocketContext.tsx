import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { useGameStore } from '@/stores/game.store';
import { useQueryClient } from '@tanstack/react-query';
import { gameKeys } from '@/hooks/useGame';
import { routes } from '@/routes';
import {
  ERROR_CODES,
  type AuthenticatedMessage,
  type GameStateMessage,
  type PlayerJoinedMessage,
  type PlayerLeftMessage,
  type GameStartedMessage,
  type GameEndedMessage,
  type CellClaimedMessage,
  type CellFailedMessage,
  type WSError,
} from '@socket-game/shared';

interface SocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { 
    setCurrentGame, 
    updateBoard, 
    addPlayer, 
    removePlayer,
    setError,
    setConnectionState
  } = useGameStore();
  
  const isConnectedRef = useRef(false);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  const connect = async () => {
    if (isConnectedRef.current) return;
    
    try {
      // Fetch WebSocket token from API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/ws-token`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // Pass the actual token to WebSocket
          gameSocket.connect(data.token);
          setupEventHandlers();
          return;
        }
      }
    } catch (error) {
      console.error('Failed to get WebSocket token:', error);
    }
    
    // Fallback to cookie auth if token fetch fails
    console.warn('Falling back to cookie auth');
    gameSocket.connect('cookie-auth');
    setupEventHandlers();
  };

  const disconnect = () => {
    gameSocket.disconnect();
    setConnectionState(false);
    isConnectedRef.current = false;
  };

  const setupEventHandlers = () => {
    // Connection events
    gameSocket.on('authenticated', (data: AuthenticatedMessage) => {
      console.log('WebSocket authenticated:', data);
      setConnectionState(true);
      isConnectedRef.current = true;
    });

    gameSocket.on('error', (error: WSError) => {
      console.error('WebSocket error:', error);
      setError(error);
      
      // Handle specific errors
      switch (error.code) {
        case ERROR_CODES.AUTH_FAILED:
        case ERROR_CODES.INVALID_TOKEN:
          // Redirect to login
          navigate(routes.landing);
          break;
        case ERROR_CODES.GAME_NOT_FOUND:
          // Redirect to dashboard
          navigate(routes.dashboard);
          break;
      }
    });

    // Game state events
    gameSocket.on('gameState', (data: GameStateMessage) => {
      setCurrentGame(data.game);
    });

    // Player events
    gameSocket.on('playerJoined', (data: PlayerJoinedMessage) => {
      addPlayer({
        userId: data.user.id,
        name: data.user.name,
        color: data.color,
        cellsOwned: 0,
        isOnline: true,
        avatarUrl: data.user.avatarUrl,
      });
      
      // Show notification
      console.log(`${data.user.name} joined the game`);
    });

    gameSocket.on('playerLeft', (data: PlayerLeftMessage) => {
      removePlayer(data.userId);
      console.log(`Player ${data.userId} left the game`);
    });

    // Game flow events
    gameSocket.on('gameStarted', (data: GameStartedMessage) => {
      // Update game state
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(data.gameId) });
      
      // Navigate to active game
      navigate(routes.gameActive.replace(':gameId', data.gameId));
      
      console.log('Game started!');
    });

    gameSocket.on('gameEnded', (data: GameEndedMessage) => {
      // Get the current game ID
      const gameId = useGameStore.getState().currentGame?.id;
      
      // Update game state - invalidate both list and specific game detail
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      if (gameId) {
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
        
        // Small delay to ensure backend has updated the game status
        setTimeout(() => {
          navigate(routes.gameResults.replace(':gameId', gameId));
        }, 500);
      }
      
      console.log(`Game ended! Winner: ${data.winner.name}`);
    });

    // Cell events
    gameSocket.on('cellClaimed', (data: CellClaimedMessage) => {
      updateBoard(data.x, data.y, data.userId);
    });

    gameSocket.on('cellFailed', (data: CellFailedMessage) => {
      console.error(`Failed to claim cell (${data.x}, ${data.y}): ${data.reason}`);
      setError({
        code: ERROR_CODES.CELL_TAKEN,
        message: data.reason,
      });
    });
  };

  const value = {
    isConnected: gameSocket.isConnected,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}