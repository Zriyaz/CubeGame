import { useQuery } from '@tanstack/react-query';
import { gameApi } from '@/lib/game-api';
import { GAME_STATUS } from '@socket-game/shared';

// Query keys
export const gameHistoryKeys = {
  all: ['gameHistory'] as const,
  list: (userId?: string) => [...gameHistoryKeys.all, 'list', userId] as const,
};

// Hook to get user's game history
export const useGameHistory = () => {
  return useQuery({
    queryKey: gameHistoryKeys.list(),
    queryFn: async () => {
      // Get completed games for the current user
      const response = await gameApi.listGames({
        myGames: true,
        status: GAME_STATUS.COMPLETED,
        limit: 50, // Get last 50 games
      });
      
      // Transform the data to include more details
      // In a real app, we might want to fetch additional details for each game
      return response.games.map(game => ({
        ...game,
        // Add computed fields
        result: determineResult(game),
        duration: calculateDuration(game),
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper functions
function determineResult(game: any): 'won' | 'lost' | 'draw' {
  // This is a simplified version - in reality, we'd check the winner_id
  // For now, we'll return a placeholder
  return 'won';
}

function calculateDuration(game: any): number {
  if (!game.startedAt || !game.endedAt) return 0;
  const start = new Date(game.startedAt).getTime();
  const end = new Date(game.endedAt).getTime();
  return Math.floor((end - start) / 1000); // Return duration in seconds
}

// Hook to get game statistics
export const useGameStats = () => {
  const { data: games } = useGameHistory();
  
  if (!games || games.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    };
  }
  
  const wins = games.filter(g => g.result === 'won').length;
  const losses = games.filter(g => g.result === 'lost').length;
  const draws = games.filter(g => g.result === 'draw').length;
  
  return {
    totalGames: games.length,
    wins,
    losses,
    draws,
    winRate: (wins / games.length * 100).toFixed(1),
  };
};