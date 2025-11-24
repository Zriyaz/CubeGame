import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '@/lib/game-api';
import { gameSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { getErrorMessage } from '@/lib/api';
import { routes } from '@/routes';
import {
  GAME_STATUS,
  type CreateGameRequest,
  type JoinGameRequest,
  type Game,
  type GameWithDetails,
  type GameListItem,
} from '@socket-game/shared';

// Query keys
export const gameKeys = {
  all: ['games'] as const,
  lists: () => [...gameKeys.all, 'list'] as const,
  list: (filters?: any) => [...gameKeys.lists(), filters] as const,
  details: () => [...gameKeys.all, 'detail'] as const,
  detail: (id: string) => [...gameKeys.details(), id] as const,
  waiting: () => [...gameKeys.lists(), 'waiting'] as const,
  myActive: () => [...gameKeys.lists(), 'my-active'] as const,
  myCompleted: () => [...gameKeys.lists(), 'my-completed'] as const,
};

/**
 * Hook to create a new game
 */
export const useCreateGame = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGameRequest) => gameApi.createGame(data),
    onSuccess: (game) => {
      // Invalidate game lists
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      // Navigate to game room
      navigate(routes.gameRoom.replace(':gameId', game.id));
    },
    onError: (error) => {
      console.error('Failed to create game:', getErrorMessage(error));
    },
  });
};

/**
 * Hook to list games
 */
export const useGameList = (filters?: { status?: string; myGames?: boolean; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: gameKeys.list(filters),
    queryFn: () => gameApi.listGames(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to get waiting games
 */
export const useWaitingGames = () => {
  return useQuery({
    queryKey: gameKeys.waiting(),
    queryFn: () => gameApi.getWaitingGames(),
    staleTime: 10 * 1000, // 10 seconds - refresh more frequently for waiting games
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
};

/**
 * Hook to get my active games
 */
export const useMyActiveGames = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: gameKeys.myActive(),
    queryFn: () => gameApi.getMyActiveGames(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to get game details
 */
export const useGameDetails = (gameId: string, options?: { refetchOnMount?: boolean | 'always' }) => {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: () => gameApi.getGame(gameId),
    staleTime: 5 * 1000, // 5 seconds
    enabled: !!gameId,
    refetchOnMount: options?.refetchOnMount ?? 'always', // Always refetch on mount to get latest status
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  });
};

/**
 * Hook to join a game
 */
export const useJoinGame = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => 
      gameApi.joinGame(gameId, {}),
    onSuccess: (game) => {
      // Invalidate game details
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.id) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      // Update the game details in cache with the latest data
      queryClient.setQueryData(gameKeys.detail(game.id), game);
      
      // Navigate to game room
      navigate(routes.gameRoom.replace(':gameId', game.id));
    },
    onError: (error) => {
      console.error('Failed to join game:', getErrorMessage(error));
    },
  });
};

/**
 * Hook to join a game by invite code
 */
export const useJoinGameByCode = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => 
      gameApi.joinGameByCode(inviteCode),
    onSuccess: (game) => {
      // Invalidate game lists
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      // Navigate to game room
      navigate(routes.gameRoom.replace(':gameId', game.id));
    },
    onError: (error) => {
      console.error('Failed to join game by code:', getErrorMessage(error));
    },
  });
};

/**
 * Hook to start a game
 */
export const useStartGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => gameApi.startGame(gameId),
    onSuccess: (_, gameId) => {
      // Invalidate game details
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      
      // The WebSocket will handle navigation to active game
    },
    onError: (error) => {
      console.error('Failed to start game:', getErrorMessage(error));
    },
  });
};

/**
 * Hook to leave a game
 */
export const useLeaveGame = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => gameApi.leaveGame(gameId),
    onSuccess: (_, gameId) => {
      // Unsubscribe from WebSocket updates
      gameSocket.unsubscribeFromGame(gameId);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      
      // Navigate to dashboard
      navigate(routes.dashboard);
    },
    onError: (error) => {
      console.error('Failed to leave game:', getErrorMessage(error));
    },
  });
};

/**
 * Hook to handle game WebSocket subscription
 */
export const useGameSubscription = (gameId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!gameId || !user) return;

    // Subscribe to game updates
    gameSocket.subscribeToGame(gameId);

    // Set up event handlers
    const handleGameState = (data: any) => {
      // Update game details in cache
      queryClient.setQueryData(gameKeys.detail(gameId), data.game);
    };

    const handlePlayerJoined = () => {
      // Refetch game details to get updated player list
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
    };

    const handlePlayerLeft = () => {
      // Refetch game details
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
    };

    const handleGameStarted = () => {
      // Refetch game details and potentially navigate
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
    };

    const handleCellClaimed = (data: any) => {
      // Update local game state optimistically
      queryClient.setQueryData<GameWithDetails>(gameKeys.detail(gameId), (old) => {
        if (!old) return old;
        
        // Check if the game is still active
        if (old.status !== 'in_progress') {
          return old; // Don't update if game is not in progress
        }
        
        // Create a deep copy of the board
        const newBoard = old.board.map(row => [...row]);
        newBoard[data.y][data.x] = data.userId;
        
        const newPlayers = old.players.map(player => {
          if (player.userId === data.userId) {
            return { ...player, cellsOwned: player.cellsOwned + 1 };
          }
          return player;
        });
        
        return {
          ...old,
          board: newBoard,
          players: newPlayers,
        };
      });
    };

    // Register event handlers
    gameSocket.on('gameState', handleGameState);
    gameSocket.on('playerJoined', handlePlayerJoined);
    gameSocket.on('playerLeft', handlePlayerLeft);
    gameSocket.on('gameStarted', handleGameStarted);
    gameSocket.on('cellClaimed', handleCellClaimed);

    // Cleanup
    return () => {
      gameSocket.unsubscribeFromGame(gameId);
      gameSocket.off('gameState', handleGameState);
      gameSocket.off('playerJoined', handlePlayerJoined);
      gameSocket.off('playerLeft', handlePlayerLeft);
      gameSocket.off('gameStarted', handleGameStarted);
      gameSocket.off('cellClaimed', handleCellClaimed);
    };
  }, [gameId, user, queryClient]);
};

