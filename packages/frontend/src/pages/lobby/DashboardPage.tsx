import { YStack, XStack, Stack, Text, ScrollView, Spinner, Avatar } from 'tamagui';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Hash, TrendingUp, Gamepad2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { routes } from '@/routes';
import { useGameList, useMyActiveGames } from '@/hooks/useGame';
import { useGameStats } from '@/hooks/useGameHistory';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { GAME_STATUS } from '@socket-game/shared';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  // Fetch waiting games
  const { data: waitingGamesData, isLoading: waitingLoading } = useGameList({
    status: GAME_STATUS.WAITING,
    limit: 10
  });

  // Fetch my active games
  const { data: myActiveGames, isLoading: activeLoading } = useMyActiveGames();

  // Get game statistics
  const stats = useGameStats();

  // Get active users
  const { data: activeUsersData, isLoading: activeUsersLoading } = useActiveUsers();

  const waitingGames = waitingGamesData?.games || [];
  const activeUsers = activeUsersData?.users || [];

  const handleJoinGame = async (gameId: string) => {
    try {
      // First join the game via API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Navigate to game room after successful join
        navigate(routes.gameRoom.replace(':gameId', gameId));
      } else {
        const error = await response.json();
        console.error('Failed to join game:', error);
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  const handleCreateGame = () => {
    navigate(routes.createGame);
  };

  const handleJoinByCode = () => {
    navigate(routes.joinGame);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$6" maxWidth={1200} margin="0 auto" width="100%">
        {/* Welcome Section */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap="$2">
            <Text fontSize="$3xl" fontWeight="bold">
              Welcome back, {user?.name || 'Player'}!
            </Text>
            <Text color="$textMuted" fontSize="$lg">
              Ready to conquer some grids?
            </Text>
          </YStack>

          <Button
            size="$3"
            variant="secondary"
            onPress={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            icon={<LogOut size={20} />}
          >
            Logout
          </Button>
        </XStack>

        {/* Stats Overview */}
        <XStack gap="$3" flexWrap="wrap">
          <Card flex={1} minWidth={150} padding="$4" alignItems="center" gap="$2">
            <TrendingUp size={24} color="$neonGreen" />
            <Text fontSize="$sm" color="$textMuted">Total Games</Text>
            <Text fontSize="$2xl" fontWeight="bold" color="$neonGreen">{stats.totalGames}</Text>
          </Card>

          <Card flex={1} minWidth={150} padding="$4" alignItems="center" gap="$2">
            <Trophy size={24} color="$neonYellow" />
            <Text fontSize="$sm" color="$textMuted">Win Rate</Text>
            <Text fontSize="$2xl" fontWeight="bold" color="$neonYellow">{stats.winRate}%</Text>
          </Card>

          <Card flex={1} minWidth={150} padding="$4" alignItems="center" gap="$2">
            <Users size={24} color="$neonBlue" />
            <Text fontSize="$sm" color="$textMuted">Active Games</Text>
            <Text fontSize="$2xl" fontWeight="bold" color="$neonBlue">{myActiveGames?.length || 0}</Text>
          </Card>
        </XStack>

        {/* Quick Actions */}
        <YStack gap="$4">
          <Text fontSize="$xl" fontWeight="bold">Quick Actions</Text>

          <XStack gap="$3" flexWrap="wrap">
            <Button
              size="$5"
              onPress={handleCreateGame}
              icon={<Plus size={20} />}
              flex={1}
              minWidth={200}
            >
              Create New Game
            </Button>

            <Button
              size="$5"
              variant="secondary"
              onPress={handleJoinByCode}
              icon={<Hash size={20} />}
              flex={1}
              minWidth={200}
            >
              Join with Code
            </Button>
          </XStack>
        </YStack>

        {/* My Active Games */}
        {myActiveGames && myActiveGames.length > 0 && (
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$xl" fontWeight="bold">My Active Games</Text>
              <Button
                size="$2"
                variant="ghost"
                onPress={() => navigate(routes.history)}
              >
                View All
              </Button>
            </XStack>

            <XStack gap="$3" flexWrap="wrap">
              {activeLoading ? (
                <Card padding="$6" alignItems="center" width="100%">
                  <Spinner size="large" color="$neonBlue" />
                  <Text marginTop="$4" color="$textMuted">Loading active games...</Text>
                </Card>
              ) : (
                myActiveGames.slice(0, 3).map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isActive
                    onPress={() => navigate(routes.gameActive.replace(':gameId', game.id))}
                  />
                ))
              )}
            </XStack>
          </YStack>
        )}

        {/* Available Games */}
        <YStack gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$xl" fontWeight="bold">Join a Game</Text>
            <Button
              size="$2"
              variant="ghost"
              onPress={() => navigate(routes.joinGame)}
            >
              Browse All
            </Button>
          </XStack>

          <XStack gap="$3" flexWrap="wrap">
            {waitingLoading ? (
              <Card padding="$6" alignItems="center" width="100%">
                <Spinner size="large" color="$neonBlue" />
                <Text marginTop="$4" color="$textMuted">Loading available games...</Text>
              </Card>
            ) : waitingGames.length === 0 ? (
              <Card padding="$6" alignItems="center" width="100%">
                <Text color="$textMuted" marginBottom="$4">No games available right now</Text>
                <Button onPress={handleCreateGame}>Create the First Game</Button>
              </Card>
            ) : (
              waitingGames.slice(0, 6).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPress={() => handleJoinGame(game.id)}
                />
              ))
            )}
          </XStack>
        </YStack>

        {/* Active Users Section */}
        <YStack gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2" alignItems="center">
              <Users size={24} color="$neonGreen" />
              <Text fontSize="$xl" fontWeight="bold">Active Players ({activeUsers.length})</Text>
            </XStack>
          </XStack>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$3" padding="$1">
              {activeUsersLoading ? (
                <Card padding="$4" width={200}>
                  <XStack gap="$3" alignItems="center">
                    <Spinner size="small" />
                    <Text color="$textMuted">Loading users...</Text>
                  </XStack>
                </Card>
              ) : activeUsers.length === 0 ? (
                <Card padding="$4" width={200}>
                  <Text color="$textMuted">No active players</Text>
                </Card>
              ) : (
                activeUsers.map((user) => (
                  <Card
                    key={user.id}
                    padding="$3"
                    minWidth={150}
                    interactive={user.isInGame}
                    onPress={user.isInGame ? () => navigate(routes.gameActive.replace(':gameId', user.gameId!)) : undefined}
                  >
                    <YStack gap="$2" alignItems="center">
                      <Stack position="relative">
                        <Avatar size="$5" circular borderWidth={2} borderColor={user.isInGame ? "$neonGreen" : "$borderColor"}>
                          {user.avatarUrl && <Avatar.Image src={user.avatarUrl} />}
                          <Avatar.Fallback backgroundColor="$surface">
                            <Text color="$text" fontWeight="bold">
                              {user.name[0].toUpperCase()}
                            </Text>
                          </Avatar.Fallback>
                        </Avatar>
                        {user.isInGame && (
                          <Stack
                            position="absolute"
                            bottom={-2}
                            right={-2}
                            backgroundColor="$neonGreen"
                            borderRadius={10}
                            padding="$1"
                          >
                            <Gamepad2 size={12} color="$black" />
                          </Stack>
                        )}
                      </Stack>
                      <Text fontSize="$sm" fontWeight="bold" numberOfLines={1}>
                        {user.name}
                      </Text>
                      <Text fontSize="$xs" color={user.isInGame ? "$neonGreen" : "$textMuted"}>
                        {user.isInGame ? 'In Game' : 'Online'}
                      </Text>
                    </YStack>
                  </Card>
                ))
              )}
            </XStack>
          </ScrollView>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

interface GameCardProps {
  game: any;
  isActive?: boolean;
  onPress: () => void;
}

function GameCard({ game, isActive, onPress }: GameCardProps) {
  const spotsLeft = (game.max_players || game.maxPlayers) - (game.playerCount || game.player_count || 0);
  const isFull = spotsLeft <= 0;

  return (
    <Card
      flex={1}
      minWidth={280}
      interactive={!isFull}
      onPress={!isFull || isActive ? onPress : undefined}
      opacity={isFull && !isActive ? 0.6 : 1}
      variant={isActive ? "elevated" : "outlined"}
      borderColor={isActive ? "$neonGreen" : undefined}
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap="$1" flex={1}>
            <Text fontSize="$lg" fontWeight="bold" numberOfLines={1}>
              {game.name}
            </Text>
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$sm" color="$textMuted">
                {game.board_size || game.boardSize}x{game.board_size || game.boardSize}
              </Text>
              <Text fontSize="$sm" color={isFull ? "$error" : "$success"}>
                {game.playerCount || game.player_count || 0}/{game.max_players || game.maxPlayers} players
              </Text>
            </XStack>
          </YStack>

          {isActive ? (
            <Stack
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor="$neonGreen"
              borderRadius="$sm"
            >
              <Text fontSize="$xs" fontWeight="bold" color="$black">
                IN PROGRESS
              </Text>
            </Stack>
          ) : isFull ? (
            <Stack
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor="$error"
              borderRadius="$sm"
            >
              <Text fontSize="$xs" fontWeight="bold" color="$white">
                FULL
              </Text>
            </Stack>
          ) : (
            <Stack
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor="$neonBlue"
              borderRadius="$sm"
            >
              <Text fontSize="$xs" fontWeight="bold" color="$white">
                OPEN
              </Text>
            </Stack>
          )}
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$sm" color="$textMuted">
            by {game.creatorName || game.creator_name || 'Unknown'}
          </Text>

          {!isFull && !isActive && (
            <Button size="$2" variant="secondary" onPress={onPress}>
              Join
            </Button>
          )}

          {isActive && (
            <Button size="$2" variant="primary" onPress={onPress}>
              Continue
            </Button>
          )}
        </XStack>
      </YStack>
    </Card>
  );
}

// Import Trophy component
import { Trophy } from 'lucide-react';