import { useState } from 'react';
import { YStack, XStack, Stack, Text, ScrollView, Spinner } from 'tamagui';
import { Calendar, Trophy, Users, Clock, TrendingUp, Filter } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useGameHistory, useGameStats } from '@/hooks/useGameHistory';
import { GAME_STATUS, type GameListItem } from '@socket-game/shared';
import { routes } from '@/routes';

interface GameHistoryItem extends GameListItem {
  result: 'won' | 'lost' | 'draw';
  duration: number;
}

type FilterType = 'all' | 'won' | 'lost' | 'draw';

export function GameHistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMonth] = useState<string>('all');
  
  // Fetch game history from API
  const { data: games, isLoading, error } = useGameHistory();
  const stats = useGameStats();
  
  if (isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$neonBlue" />
        <Text marginTop="$4" color="$textMuted">Loading game history...</Text>
      </Stack>
    );
  }
  
  if (error || !games) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize="$xl" color="$error">Failed to load game history</Text>
        <Button style={{ marginTop: 16 }} onPress={() => navigate(routes.dashboard)}>
          Back to Dashboard
        </Button>
      </Stack>
    );
  }

  const filteredGames = games.filter((game: GameHistoryItem) => {
    if (filter !== 'all' && game.result !== filter) return false;
    
    if (selectedMonth !== 'all') {
      const gameDate = new Date(game.createdAt);
      const gameMonth = gameDate.toISOString().slice(0, 7);
      if (gameMonth !== selectedMonth) return false;
    }
    
    return true;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins} minutes ago`;
    } else if (hours < 24) {
      return `${Math.floor(hours)} hours ago`;
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1000} margin="0 auto" width="100%">
        <YStack gap="$2">
          <Text fontSize="$2xl" fontWeight="bold">Game History</Text>
          <Text color="$textMuted">Review your past battles</Text>
        </YStack>

        {/* Stats Summary */}
        <XStack gap="$3" flexWrap="wrap">
          <StatCard
            icon={<Trophy />}
            label="Total Games"
            value={stats.totalGames}
            color="$neonBlue"
          />
          <StatCard
            icon={<TrendingUp />}
            label="Win Rate"
            value={`${stats.winRate}%`}
            color="$success"
          />
          <StatCard
            label="W/L/D"
            value={`${stats.wins}/${stats.losses}/${stats.draws}`}
            color="$neonPink"
          />
        </XStack>

        {/* Filters */}
        <Card variant="elevated" padding="$3">
          <XStack gap="$3" flexWrap="wrap" alignItems="center">
            <XStack gap="$2" alignItems="center">
              <Filter size={20} color="$textMuted" />
              <Text fontWeight="bold">Filter:</Text>
            </XStack>
            
            <XStack gap="$2">
              {(['all', 'won', 'lost', 'draw'] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  size="$3"
                  variant={filter === f ? 'primary' : 'ghost'}
                  onPress={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </XStack>
          </XStack>
        </Card>

        {/* Games List */}
        <YStack gap="$3">
          {filteredGames.length === 0 ? (
            <Card padding="$8" alignItems="center">
              <Text color="$textMuted">
                {games.length === 0 ? 'No completed games yet' : 'No games match your filter'}
              </Text>
              {games.length === 0 && (
                <Button
                  style={{ marginTop: 16 }}
                  onPress={() => navigate(routes.createGame)}
                >
                  Create Your First Game
                </Button>
              )}
            </Card>
          ) : (
            filteredGames.map((game) => (
              <GameHistoryCard
                key={game.id}
                game={game}
                onView={() => navigate(routes.gameResults.replace(':gameId', game.id))}
              />
            ))
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card flex={1} minWidth={150} variant="outlined" padding="$3" alignItems="center" gap="$2">
      {icon && <Stack>{icon}</Stack>}
      <Text fontSize="$sm" color="$textMuted">{label}</Text>
      <Text fontSize="$2xl" fontWeight="bold" color={color}>{value}</Text>
    </Card>
  );
}

function GameHistoryCard({ game, onView }: { game: GameHistoryItem; onView: () => void }) {
  // For now, we'll show simplified data until we have full game details
  const gameDate = new Date(game.createdAt);
  const resultColor = game.result === 'won' ? '$success' : game.result === 'lost' ? '$error' : '$neonYellow';
  const resultEmoji = game.result === 'won' ? '🏆' : game.result === 'lost' ? '💀' : '🤝';
  
  return (
    <Card variant="outlined" interactive onPress={onView}>
      <YStack gap="$3">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap="$1">
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$lg" fontWeight="bold">{game.name}</Text>
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$1"
                backgroundColor={resultColor}
                borderRadius="$sm"
              >
                <Text fontSize="$xs" fontWeight="bold" color="$white">
                  {resultEmoji} {game.result.toUpperCase()}
                </Text>
              </Stack>
            </XStack>
            
            <XStack gap="$3">
              <XStack gap="$1" alignItems="center">
                <Calendar size={14} color="$textMuted" />
                <Text fontSize="$sm" color="$textMuted">{formatDate(gameDate)}</Text>
              </XStack>
              
              <XStack gap="$1" alignItems="center">
                <Clock size={14} color="$textMuted" />
                <Text fontSize="$sm" color="$textMuted">{formatDuration(game.duration)}</Text>
              </XStack>
              
              <XStack gap="$1" alignItems="center">
                <Users size={14} color="$textMuted" />
                <Text fontSize="$sm" color="$textMuted">{game.playerCount} players</Text>
              </XStack>
            </XStack>
          </YStack>
          
          <Button
            size="$3"
            variant="ghost"
            onPress={onView}
          >
            View Details
          </Button>
        </XStack>

        {/* Game Details */}
        <XStack gap="$4" flexWrap="wrap">
          <YStack gap="$1">
            <Text fontSize="$xs" color="$textMuted">Board Size</Text>
            <Text fontWeight="bold">{game.boardSize}x{game.boardSize}</Text>
          </YStack>
          
          <YStack gap="$1">
            <Text fontSize="$xs" color="$textMuted">Status</Text>
            <Text fontWeight="bold" color={game.status === GAME_STATUS.COMPLETED ? '$success' : '$textMuted'}>
              {game.status}
            </Text>
          </YStack>
          
          <YStack gap="$1">
            <Text fontSize="$xs" color="$textMuted">Max Players</Text>
            <Text fontWeight="bold" color="$neonGreen">{game.maxPlayers}</Text>
          </YStack>
        </XStack>

        {/* Creator */}
        <YStack gap="$2">
          <Text fontSize="$sm" fontWeight="bold">Created by</Text>
          <Text fontSize="$sm">{game.creatorName}</Text>
        </YStack>
      </YStack>
    </Card>
  );
}

const formatDate = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  
  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins} minutes ago`;
  } else if (hours < 24) {
    return `${Math.floor(hours)} hours ago`;
  } else if (hours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};