import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YStack, XStack, Stack, Text, AnimatePresence } from 'tamagui';
import { Trophy, Award, Target, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth.store';
import { soundManager } from '@/utils/sound/soundManager';
import { useGameDetails } from '@/hooks/useGame';
import { GAME_STATUS, type Player } from '@socket-game/shared';
import { routes } from '@/routes';

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
  
  // Fetch game data with refetch on mount to ensure fresh data
  const { data: gameDetails, isLoading, refetch } = useGameDetails(gameId!);
  
  // Refetch on mount to ensure we have the latest game status
  useEffect(() => {
    refetch();
  }, [refetch]);
  
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
  const winner = rankedPlayers[0];
  const totalCells = gameDetails.boardSize * gameDetails.boardSize;
  const claimedCells = gameDetails.board.flat().filter(cell => cell !== null).length;
  
  // Calculate game stats (mock for now - should come from backend)
  const [gameStats] = useState<GameStats>({
    duration: Math.floor((Date.now() - new Date(gameDetails.startedAt || '').getTime()) / 1000),
    totalMoves: claimedCells,
    longestStreak: 8,
    biggestCapture: 5,
  });

  useEffect(() => {
    if (!currentPlayer) return;
    
    setIsWinner(currentPlayer.rank === 1);
    
    // Play appropriate sound
    if (currentPlayer.rank === 1) {
      soundManager.play('victory');
    } else {
      soundManager.play('defeat');
    }

    // Trigger animations
    setTimeout(() => setShowStats(true), 500);
    setTimeout(() => setShowPlayers(true), 1000);
  }, [currentPlayer]);

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
      <YStack space="$6" maxWidth={800} width="100%" alignItems="center">
        {/* Result Animation */}
        <AnimatePresence>
          <Stack
            animation="bouncy"
            enterStyle={{ scale: 0, opacity: 0 }}
            exitStyle={{ scale: 0, opacity: 0 }}
            scale={1}
            opacity={1}
          >
            <YStack space="$4" alignItems="center">
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
              space="$3"
              width="100%"
              animation="quick"
              enterStyle={{ x: -50, opacity: 0 }}
              x={0}
              opacity={1}
            >
              <Text fontSize="$lg" fontWeight="bold" textAlign="center" marginBottom="$2">
                Final Rankings
              </Text>
              {rankedPlayers.map((player, index) => (
                <Stack
                  key={player.userId}
                  animation="quick"
                  enterStyle={{ x: -50, opacity: 0 }}
                  x={0}
                  opacity={1}
                  animationDelay={index * 100}
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
              space="$4"
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
        <XStack space="$4" width="100%" maxWidth={400}>
          <Button
            flex={1}
            size="$5"
            onPress={handlePlayAgain}
          >
            Play Again
          </Button>
          <Button
            flex={1}
            size="$5"
            variant="secondary"
            onPress={handleViewHistory}
          >
            View Details
          </Button>
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
      <XStack alignItems="center" space="$3">
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
          <XStack space="$2" alignItems="center">
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
      space="$2"
      minWidth={140}
    >
      <Stack color={color}>
        {icon}
      </Stack>
      <Text fontSize="$sm" color="$textMuted">{label}</Text>
      <Text fontSize="$2xl" fontWeight="bold" color={color}>
        {value}
      </Text>
    </Card>
  );
}