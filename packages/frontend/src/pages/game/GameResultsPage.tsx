import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YStack, XStack, Stack, Text, AnimatePresence } from 'tamagui';
import { Trophy, Award, Target, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth.store';
import { soundManager } from '@/utils/sound/soundManager';
import { useGameDetails } from '@/hooks/useGame';
import { GAME_STATUS, type Player, type GameWithDetails } from '@socket-game/shared';
import { routes } from '@/routes';

// Extend the GameWithDetails type to include both snake_case and camelCase fields
// This handles the API response which includes both formats
interface GameWithDetailsExtended extends GameWithDetails {
  boardSize?: number;
  startedAt?: string;
  endedAt?: string;
}

interface GameStats {
  duration: number;
  totalMoves: number;
  longestStreak: number;
  biggestCapture: number;
}

export function GameResultsPage() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuthStore();
  const [isWinner, setIsWinner] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    duration: 0,
    totalMoves: 0,
    longestStreak: 8,
    biggestCapture: 5,
  });

  // Fetch game data with refetch on mount to ensure fresh data
  const { data: gameDetails, isLoading, refetch } = useGameDetails(gameId!) as {
    data: GameWithDetailsExtended | undefined;
    isLoading: boolean;
    refetch: () => void;
  };

  // Refetch on mount to ensure we have the latest game status
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Calculate game stats after game details are loaded
  useEffect(() => {
    if (gameDetails && gameDetails.status === GAME_STATUS.COMPLETED) {
      const startedAt = gameDetails.started_at || gameDetails.startedAt;
      const endedAt = gameDetails.ended_at || gameDetails.endedAt;

      if (startedAt && endedAt) {
        const startTime = new Date(startedAt).getTime();
        const endTime = new Date(endedAt).getTime();
        const duration = Math.floor((endTime - startTime) / 1000);
        const claimedCells = gameDetails.board.flat().filter(cell => cell !== null).length;

        setGameStats(prev => ({
          ...prev,
          duration: duration,
          totalMoves: claimedCells,
        }));
      }
    }
  }, [gameDetails]);

  // Effect for winner/defeat sounds - must be called before any returns
  useEffect(() => {
    if (!gameDetails || gameDetails.status !== GAME_STATUS.COMPLETED || !user) return;
    const sortedPlayers = [...gameDetails.players].sort((a, b) => b.cellsOwned - a.cellsOwned);
    const currentPlayer = sortedPlayers.find(p => p.userId === user.id);

    if (!currentPlayer) return;

    const rank = sortedPlayers.findIndex(p => p.userId === user.id) + 1;
    setIsWinner(rank === 1);

    // Play appropriate sound
    if (rank === 1) {
      soundManager.play('victory');
    } else {
      soundManager.play('defeat');
    }

    // Trigger animations
    setTimeout(() => setShowStats(true), 500);
    setTimeout(() => setShowPlayers(true), 1000);
  }, [gameDetails, user]);

  if (isLoading || !gameDetails) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Text>Loading game results...</Text>
      </Stack>
    );
  }

  // If game is not completed, show appropriate message
  if (gameDetails.status !== GAME_STATUS.COMPLETED) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Text fontSize="$lg">Game Status: {gameDetails.status}</Text>
        {gameDetails.status === GAME_STATUS.IN_PROGRESS && (
          <>
            <Text>Game is still in progress</Text>
            <Button onPress={() => navigate(routes.gameActive.replace(':gameId', gameId!))}>
              Return to Game
            </Button>
          </>
        )}
        {gameDetails.status === GAME_STATUS.WAITING && (
          <>
            <Text>Game hasn't started yet</Text>
            <Button onPress={() => navigate(routes.gameRoom.replace(':gameId', gameId!))}>
              Return to Game Room
            </Button>
          </>
        )}
      </Stack>
    );
  }

  // Sort players by cells owned to get rankings
  const sortedPlayers = [...gameDetails.players].sort((a, b) => b.cellsOwned - a.cellsOwned);
  const rankedPlayers = sortedPlayers.map((player, index) => ({
    ...player,
    rank: index + 1
  }));

  const currentPlayer = rankedPlayers.find(p => p.userId === user?.id);
  const boardSize = gameDetails.board_size || gameDetails.boardSize || 8;
  const totalCells = boardSize * boardSize;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAgain = () => {
    navigate(routes.dashboard);
  };

  const handleViewHistory = () => {
    navigate(routes.history);
  };

  return (
    <Stack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center" padding="$4">
      <YStack gap="$6" maxWidth={800} width="100%" alignItems="center">
        {/* Result Animation */}
        <AnimatePresence>
          <Stack
            animation="bouncy"
            enterStyle={{ scale: 0, opacity: 0 }}
            exitStyle={{ scale: 0, opacity: 0 }}
            scale={1}
            opacity={1}
          >
            <YStack gap="$4" alignItems="center">
              {isWinner ? (
                <>
                  <Stack
                    animation="bouncy"
                    enterStyle={{ rotate: '180deg' }}
                    rotate="0deg"
                  >
                    <Trophy size={120} color="$neonYellow" strokeWidth={1.5} />
                  </Stack>
                  <Text
                    fontSize={64}
                    fontWeight="900"
                    color="$neonYellow"
                    style={{ fontFamily: 'Orbitron, monospace' }}
                    animation="bouncy"
                    enterStyle={{ y: -50, opacity: 0 }}
                    y={0}
                    opacity={1}
                  >
                    VICTORY!
                  </Text>
                </>
              ) : (
                <>
                  <Stack opacity={0.6}>
                    <Award size={120} color="$textMuted" strokeWidth={1.5} />
                  </Stack>
                  <Text
                    fontSize={48}
                    fontWeight="900"
                    color="$textMuted"
                    style={{ fontFamily: 'Orbitron, monospace' }}
                  >
                    Game Over
                  </Text>
                  <Text fontSize="$xl" color="$neonBlue" fontWeight="bold">
                    #{currentPlayer?.rank || '-'} Place
                  </Text>
                </>
              )}
            </YStack>
          </Stack>
        </AnimatePresence>

        {/* Player Rankings */}
        <AnimatePresence>
          {showPlayers && (
            <YStack
              gap="$3"
              width="100%"
              animation="quick"
              enterStyle={{ x: -50, opacity: 0 }}
              x={0}
              opacity={1}
            >
              <Text fontSize="$lg" fontWeight="bold" textAlign="center" marginBottom="$2">
                Final Rankings
              </Text>
              {rankedPlayers.map((player) => (
                <Stack
                  key={player.userId}
                  animation="quick"
                  enterStyle={{ x: -50, opacity: 0 }}
                  x={0}
                  opacity={1}
                >
                  <PlayerResultCard
                    player={player}
                    isCurrentPlayer={player.userId === user?.id}
                    totalCells={totalCells}
                  />
                </Stack>
              ))}
            </YStack>
          )}
        </AnimatePresence>

        {/* Game Stats */}
        <AnimatePresence>
          {showStats && (
            <XStack
              gap="$4"
              flexWrap="wrap"
              justifyContent="center"
              animation="quick"
              enterStyle={{ y: 50, opacity: 0 }}
              y={0}
              opacity={1}
            >
              <StatCard
                icon={<Clock size={24} />}
                label="Duration"
                value={formatTime(gameStats.duration)}
                color="$neonBlue"
              />
              <StatCard
                icon={<Target size={24} />}
                label="Total Moves"
                value={gameStats.totalMoves.toString()}
                color="$neonGreen"
              />
              <StatCard
                icon={<TrendingUp size={24} />}
                label="Longest Streak"
                value={gameStats.longestStreak.toString()}
                color="$neonPink"
              />
              <StatCard
                icon={<Award size={24} />}
                label="Biggest Capture"
                value={gameStats.biggestCapture.toString()}
                color="$neonYellow"
              />
            </XStack>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <XStack gap="$4" width="100%" maxWidth={400}>
          <Stack flex={1}>
            <Button
              size="$5"
              onPress={handlePlayAgain}
            >
              Play Again
            </Button>
          </Stack>
          <Stack flex={1}>
            <Button
              size="$5"
              variant="secondary"
              onPress={handleViewHistory}
            >
              View Details
            </Button>
          </Stack>
        </XStack>
      </YStack>
    </Stack>
  );
}

interface PlayerWithRank extends Player {
  rank: number;
}

function PlayerResultCard({ player, isCurrentPlayer, totalCells }: {
  player: PlayerWithRank;
  isCurrentPlayer: boolean;
  totalCells: number;
}) {
  const rankEmoji = ['🥇', '🥈', '🥉', ''][player.rank - 1] || '';

  return (
    <Card
      backgroundColor={isCurrentPlayer ? '$surfaceHover' : '$surface'}
      borderWidth={isCurrentPlayer ? 2 : 0}
      borderColor={isCurrentPlayer ? '$neonBlue' : undefined}
    >
      <XStack alignItems="center" gap="$3">
        <Text fontSize={32} width={48} textAlign="center">
          {rankEmoji || `#${player.rank}`}
        </Text>

        <Stack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={player.color}
        />

        <YStack flex={1}>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$lg" fontWeight="bold">
              {player.name}
            </Text>
            {isCurrentPlayer && (
              <Text fontSize="$sm" color="$neonBlue">(You)</Text>
            )}
          </XStack>
          <Text fontSize="$sm" color="$textMuted">
            {player.cellsOwned} cells captured
          </Text>
        </YStack>

        <Text fontSize="$xl" fontWeight="bold" color={player.color}>
          {totalCells > 0 ? ((player.cellsOwned / totalCells) * 100).toFixed(0) : 0}%
        </Text>
      </XStack>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card
      variant="outlined"
      padding="$4"
      alignItems="center"
      gap="$2"
      minWidth={140}
    >
      <Stack>
        <Text color={color}>{icon}</Text>
      </Stack>
      <Text fontSize="$sm" color="$textMuted">{label}</Text>
      <Text fontSize="$2xl" fontWeight="bold" color={color}>
        {value}
      </Text>
    </Card>
  );
}