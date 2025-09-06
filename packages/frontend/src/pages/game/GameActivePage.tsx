import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YStack, XStack, Stack, Text, AnimatePresence } from 'tamagui';
import { Timer, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GameBoard } from '@/components/game/GameBoard';
import { SoundToggle } from '@/components/game/GameControls';
import { useAuthStore } from '@/stores/auth.store';
import { soundManager } from '@/utils/sound/soundManager';
import { useGameDetails, useGameSubscription } from '@/hooks/useGame';
import { useGameStore, selectIsGameActive } from '@/stores/game.store';
import { gameSocket } from '@/lib/socket';
import { GAME_STATUS, ERROR_CODES } from '@socket-game/shared';
import { routes } from '@/routes';

export function GameActivePage() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuthStore();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  
  // API and WebSocket hooks
  const { data: gameDetails, isLoading } = useGameDetails(gameId!);
  useGameSubscription(gameId!);
  
  // Game state from store
  const currentGame = useGameStore((state) => state.currentGame);
  const isGameActive = useGameStore(selectIsGameActive);
  const setError = useGameStore((state) => state.setError);
  const lastError = useGameStore((state) => state.lastError);
  
  // Use WebSocket data if available, otherwise use API data
  const game = currentGame || gameDetails;
  const currentPlayer = game?.players.find(p => p.userId === user?.id);
  const totalCells = game ? game.boardSize * game.boardSize : 0;
  const claimedCells = game ? 
    game.board.flat().filter(cell => cell !== null).length : 0;

  // Redirect if game is not active
  useEffect(() => {
    if (game && game.status !== GAME_STATUS.IN_PROGRESS) {
      if (game.status === GAME_STATUS.COMPLETED) {
        navigate(routes.gameResults.replace(':gameId', gameId!));
      } else if (game.status === GAME_STATUS.WAITING) {
        navigate(routes.gameRoom.replace(':gameId', gameId!));
      }
    }
  }, [game?.status, gameId, navigate]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // Clear error after 3 seconds
  useEffect(() => {
    if (lastError) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastError, setError]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = useCallback((x: number, y: number) => {
    if (!isGameActive || !game) return;
    
    const cell = game.board[y][x];
    if (cell !== null) {
      // Cell already owned
      soundManager.play('error');
      setError({
        code: ERROR_CODES.CELL_TAKEN,
        message: 'This cell is already taken!',
      });
      return;
    }
    
    soundManager.play('cellClick');
    
    // Send click event to server
    gameSocket.clickCell(gameId!, x, y);
    
    // Add to recent actions
    const player = game.players.find(p => p.userId === cell);
    setRecentActions(prev => [`You clicked cell (${x}, ${y})`, ...prev.slice(0, 4)]);
  }, [isGameActive, game, gameId, setError]);

  const handleLeaveGame = () => {
    // TODO: Confirm before leaving
    navigate(routes.dashboard);
  };
  
  if (isLoading || !game) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Text>Loading game...</Text>
      </Stack>
    );
  }
  
  // Sort players by cells owned for leaderboard
  const sortedPlayers = [...game.players].sort((a, b) => b.cellsOwned - a.cellsOwned);

  return (
    <Stack flex={1} backgroundColor="$background">
      {/* Game Header */}
      <XStack
        backgroundColor="$surface"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack space="$4" alignItems="center">
          <XStack space="$2" alignItems="center">
            <Timer size={20} color="$neonBlue" />
            <Text fontSize="$lg" fontWeight="bold">{formatTime(timeElapsed)}</Text>
          </XStack>
          
          <Text fontSize="$lg" fontWeight="bold">{game.name}</Text>
        </XStack>

        <XStack space="$3" alignItems="center">
          <SoundToggle size={20} />
          <Button
            size="$3"
            variant="danger"
            onPress={handleLeaveGame}
          >
            Leave
          </Button>
        </XStack>
      </XStack>

      {/* Main Game Area */}
      <Stack flex={1} alignItems="center">
        <XStack flex={1} width="100%" maxWidth={1600}>
        {/* Left Sidebar - Players */}
        <YStack
          width={280}
          backgroundColor="$surface"
          padding="$4"
          borderRightWidth={1}
          borderRightColor="$borderColor"
          space="$4"
        >
          <YStack space="$2">
            <XStack space="$2" alignItems="center">
              <Users size={20} color="$neonBlue" />
              <Text fontSize="$lg" fontWeight="bold">Players</Text>
            </XStack>
            <Text fontSize="$sm" color="$textMuted">
              {claimedCells}/{totalCells} cells claimed
            </Text>
          </YStack>

          <YStack space="$3">
            {sortedPlayers.map((player) => (
              <PlayerScoreCard
                key={player.userId}
                player={{
                  id: player.userId,
                  name: player.name,
                  color: player.color,
                  cellsOwned: player.cellsOwned,
                  isActive: player.isOnline
                }}
                isCurrentTurn={false}
                totalCells={totalCells}
              />
            ))}
          </YStack>

          <Card backgroundColor="$background" padding="$3" space="$2">
            <Text fontSize="$sm" fontWeight="bold" color="$neonYellow">
              Power-ups Available
            </Text>
            <XStack space="$2">
              <Button size="$2" variant="secondary" disabled>
                <Zap size={16} /> 2x Speed
              </Button>
              <Button size="$2" variant="secondary" disabled>
                🛡️ Shield
              </Button>
            </XStack>
          </Card>
        </YStack>

        {/* Center - Game Board */}
        <Stack flex={1} alignItems="center" justifyContent="center" padding="$4">
          <YStack space="$4" alignItems="center">
            {/* Error Message */}
            {lastError && (
              <Card
                backgroundColor="$error"
                padding="$3"
                animation="quick"
                enterStyle={{ opacity: 0, y: -10 }}
                exitStyle={{ opacity: 0, y: -10 }}
              >
                <Text color="white" fontWeight="bold">
                  {lastError.message}
                </Text>
              </Card>
            )}
            
            {isGameActive ? (
              <Text fontSize="$xl" fontWeight="bold" color="$neonGreen">
                Click an empty cell to claim it!
              </Text>
            ) : (
              <Text fontSize="$xl" fontWeight="bold" color="$textMuted">
                Game not active
              </Text>
            )}

            <GameBoard
              size={game.boardSize}
              board={game.board.map((row, y) => 
                row.map((cell, x) => ({
                  ownerId: cell,
                  color: cell ? game.players.find(p => p.userId === cell)?.color : undefined
                }))
              )}
              currentPlayerId={user?.id || ''}
              onCellClick={handleCellClick}
              cellSize={60}
            />
          </YStack>
        </Stack>

        {/* Right Sidebar - Activity Feed */}
        <YStack
          width={280}
          backgroundColor="$surface"
          padding="$4"
          borderLeftWidth={1}
          borderLeftColor="$borderColor"
          space="$4"
        >
          <YStack space="$2">
            <XStack space="$2" alignItems="center">
              <TrendingUp size={20} color="$neonBlue" />
              <Text fontSize="$lg" fontWeight="bold">Activity</Text>
            </XStack>
          </YStack>

          <YStack space="$2">
            <AnimatePresence>
              {recentActions.length === 0 ? (
                <Text color="$textMuted" fontSize="$sm" textAlign="center" paddingVertical="$4">
                  Game started! Make your move
                </Text>
              ) : (
                recentActions.map((action, index) => (
                  <Stack
                    key={`${action}-${index}`}
                    animation="quick"
                    enterStyle={{ opacity: 0, x: 20 }}
                    exitStyle={{ opacity: 0, x: -20 }}
                    opacity={1 - index * 0.2}
                  >
                    <Text fontSize="$sm" color={index === 0 ? '$white' : '$textMuted'}>
                      {action}
                    </Text>
                  </Stack>
                ))
              )}
            </AnimatePresence>
          </YStack>

          <YStack space="$2" marginTop="auto">
            <Text fontSize="$sm" fontWeight="bold" color="$textMuted">
              Game Stats
            </Text>
            <YStack space="$1">
              <XStack justifyContent="space-between">
                <Text fontSize="$xs" color="$textMuted">Duration</Text>
                <Text fontSize="$xs">{formatTime(timeElapsed)}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize="$xs" color="$textMuted">Total Moves</Text>
                <Text fontSize="$xs">{claimedCells}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize="$xs" color="$textMuted">Your Cells</Text>
                <Text fontSize="$xs" color="$neonGreen">{currentPlayer?.cellsOwned || 0}</Text>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
        </XStack>
      </Stack>
    </Stack>
  );
}

function PlayerScoreCard({ 
  player, 
  isCurrentTurn, 
  totalCells 
}: { 
  player: Player; 
  isCurrentTurn: boolean;
  totalCells: number;
}) {
  const percentage = (player.cellsOwned / totalCells) * 100;

  return (
    <Card
      padding="$3"
      backgroundColor={isCurrentTurn ? '$surfaceHover' : '$surface'}
      borderWidth={isCurrentTurn ? 2 : 0}
      borderColor={isCurrentTurn ? '$neonBlue' : undefined}
      opacity={player.isActive ? 1 : 0.5}
    >
      <YStack space="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack space="$2" alignItems="center">
            <Stack
              width={12}
              height={12}
              borderRadius={6}
              backgroundColor={player.color}
            />
            <Text fontWeight="bold" fontSize="$sm">
              {player.name}
            </Text>
            {isCurrentTurn && (
              <Text fontSize="$xs" color="$neonBlue">(Playing)</Text>
            )}
          </XStack>
          <Text fontWeight="bold" fontSize="$sm">
            {player.cellsOwned}
          </Text>
        </XStack>
        
        <Stack position="relative" height={4} backgroundColor="$background" borderRadius="$sm">
          <Stack
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            width={`${percentage}%`}
            backgroundColor={player.color}
            borderRadius="$sm"
            animation="quick"
          />
        </Stack>
        
        <Text fontSize="$xs" color="$textMuted">
          {percentage.toFixed(1)}% of board
        </Text>
      </YStack>
    </Card>
  );
}