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
    <Stack flex={1} position="relative" backgroundColor="$background">
      {/* Animated background effect */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.05}
        pointerEvents="none"
      >
        <Stack
          style={{
            background: `
              radial-gradient(circle at 15% 50%, rgba(0, 255, 255, 0.3) 0%, transparent 40%),
              radial-gradient(circle at 85% 30%, rgba(255, 0, 255, 0.3) 0%, transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(0, 255, 136, 0.3) 0%, transparent 40%)
            `,
            animation: 'bgFloat 20s ease-in-out infinite',
          }}
          width="100%"
          height="100%"
        />
      </Stack>
      
      <ScrollView 
        flex={1} 
        backgroundColor="transparent"
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <Stack flex={1} alignItems="center" width="100%">
          <YStack padding="$5" gap="$6" width="100%" maxWidth={1200}>
          {/* Welcome Section */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$2">
              <Text 
                fontSize={40} 
                fontWeight="900"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(135deg, #00D4FF 0%, #FF0080 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 60px rgba(0, 212, 255, 0.5)',
                }}
              >
                Welcome back, {user?.name || 'Player'}!
              </Text>
              <Text color="$neonCyan" fontSize="$lg" opacity={0.8}>
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
        <XStack gap="$4" flexWrap="wrap">
          <Card 
            flex={1} 
            minWidth={180} 
            padding="$5" 
            alignItems="center" 
            gap="$3"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
              boxShadow: '0 0 40px rgba(0, 255, 136, 0.2)',
            }}
          >
            <Stack 
              padding="$3" 
              borderRadius={16}
              style={{
                background: 'rgba(0, 255, 136, 0.2)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)',
              }}
            >
              <TrendingUp size={28} color="#00FF88" />
            </Stack>
            <Text fontSize="$sm" color="$textMuted" textTransform="uppercase" letterSpacing={1.2}>
              Total Games
            </Text>
            <Text 
              fontSize={32} 
              fontWeight="900" 
              color="$neonGreen"
              style={{ fontFamily: 'Rajdhani, monospace' }}
            >
              {stats.totalGames}
            </Text>
          </Card>

          <Card 
            flex={1} 
            minWidth={180} 
            padding="$5" 
            alignItems="center" 
            gap="$3"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 221, 0, 0.1) 0%, rgba(255, 221, 0, 0.05) 100%)',
              boxShadow: '0 0 40px rgba(255, 221, 0, 0.2)',
            }}
          >
            <Stack 
              padding="$3" 
              borderRadius={16}
              style={{
                background: 'rgba(255, 221, 0, 0.2)',
                boxShadow: '0 0 20px rgba(255, 221, 0, 0.4)',
              }}
            >
              <Trophy size={28} color="#FFDD00" />
            </Stack>
            <Text fontSize="$sm" color="$textMuted" textTransform="uppercase" letterSpacing={1.2}>
              Win Rate
            </Text>
            <Text 
              fontSize={32} 
              fontWeight="900" 
              color="$neonYellow"
              style={{ fontFamily: 'Rajdhani, monospace' }}
            >
              {stats.winRate}%
            </Text>
          </Card>

          <Card 
            flex={1} 
            minWidth={180} 
            padding="$5" 
            alignItems="center" 
            gap="$3"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.2)',
            }}
          >
            <Stack 
              padding="$3" 
              borderRadius={16}
              style={{
                background: 'rgba(0, 212, 255, 0.2)',
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
              }}
            >
              <Users size={28} color="#00D4FF" />
            </Stack>
            <Text fontSize="$sm" color="$textMuted" textTransform="uppercase" letterSpacing={1.2}>
              Active Games
            </Text>
            <Text 
              fontSize={32} 
              fontWeight="900" 
              color="$neonBlue"
              style={{ fontFamily: 'Rajdhani, monospace' }}
            >
              {myActiveGames?.length || 0}
            </Text>
          </Card>
        </XStack>

        {/* Quick Actions */}
        <YStack gap="$4">
          <Text 
            fontSize={28} 
            fontWeight="900" 
            style={{ 
              fontFamily: 'Orbitron, monospace',
              letterSpacing: 1,
            }}
          >
            Quick Actions
          </Text>

          <XStack gap="$4" flexWrap="wrap">
            <Stack flex={1} minWidth={220}>
              <Button
                size="$6"
                onPress={handleCreateGame}
                icon={<Plus size={24} />}
                fullWidth
                style={{
                  paddingVertical: 20,
                  fontSize: 18,
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
                  boxShadow: '0 4px 20px rgba(0, 212, 255, 0.4)',
                }}
              >
                Create New Game
              </Button>
            </Stack>

            <Stack flex={1} minWidth={220}>
              <Button
                size="$6"
                variant="secondary"
                onPress={handleJoinByCode}
                icon={<Hash size={24} />}
                fullWidth
                style={{
                  paddingVertical: 20,
                  fontSize: 18,
                  fontWeight: 'bold',
                }}
              >
                Join with Code
              </Button>
            </Stack>
          </XStack>
        </YStack>

        {/* My Active Games */}
        {myActiveGames && myActiveGames.length > 0 && (
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text 
                fontSize={28} 
                fontWeight="900" 
                style={{ 
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: 1,
                }}
              >
                My Active Games
              </Text>
              <Button
                size="$2"
                variant="ghost"
                onPress={() => navigate(routes.history)}
                style={{ opacity: 0.8 }}
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
            <Text 
              fontSize={28} 
              fontWeight="900" 
              style={{ 
                fontFamily: 'Orbitron, monospace',
                letterSpacing: 1,
              }}
            >
              Join a Game
            </Text>
            <Button
              size="$2"
              variant="ghost"
              onPress={() => navigate(routes.joinGame)}
              style={{ opacity: 0.8 }}
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
            <XStack gap="$3" alignItems="center">
              <Stack
                padding="$2"
                borderRadius={12}
                style={{
                  background: 'rgba(0, 255, 136, 0.2)',
                  boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)',
                }}
              >
                <Users size={24} color="#00FF88" />
              </Stack>
              <Text 
                fontSize={28} 
                fontWeight="900" 
                style={{ 
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: 1,
                }}
              >
                Active Players
              </Text>
              <Text 
                fontSize={24} 
                color="$neonGreen"
                fontWeight="bold"
                style={{ fontFamily: 'Rajdhani, monospace' }}
              >
                ({activeUsers.length})
              </Text>
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
                    padding="$4"
                    minWidth={160}
                    interactive={user.isInGame}
                    onPress={user.isInGame ? () => navigate(routes.gameActive.replace(':gameId', user.gameId!)) : undefined}
                    style={{
                      background: user.isInGame 
                        ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(18, 18, 26, 0.8) 0%, rgba(10, 10, 15, 0.8) 100%)',
                      borderColor: user.isInGame ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      boxShadow: user.isInGame 
                        ? '0 0 20px rgba(0, 255, 136, 0.2)'
                        : '0 4px 15px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <YStack gap="$3" alignItems="center">
                      <Stack position="relative">
                        <Avatar 
                          size={56} 
                          circular 
                          borderWidth={2} 
                          style={{
                            borderColor: user.isInGame ? '#00FF88' : 'rgba(255, 255, 255, 0.1)',
                            boxShadow: user.isInGame 
                              ? '0 0 20px rgba(0, 255, 136, 0.5)'
                              : '0 0 10px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {user.avatarUrl && <Avatar.Image src={user.avatarUrl} />}
                          <Avatar.Fallback 
                            style={{
                              background: user.isInGame 
                                ? 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)'
                                : 'linear-gradient(135deg, #1A1A2E 0%, #0F0F1E 100%)',
                            }}
                          >
                            <Text 
                              color={user.isInGame ? "$black" : "$white"} 
                              fontWeight="900"
                              fontSize={20}
                            >
                              {user.name[0].toUpperCase()}
                            </Text>
                          </Avatar.Fallback>
                        </Avatar>
                        {user.isInGame && (
                          <Stack
                            position="absolute"
                            bottom={-4}
                            right={-4}
                            width={24}
                            height={24}
                            borderRadius={12}
                            alignItems="center"
                            justifyContent="center"
                            style={{
                              background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
                              boxShadow: '0 0 10px rgba(0, 255, 136, 0.6)',
                            }}
                          >
                            <Gamepad2 size={14} color="#000" strokeWidth={3} />
                          </Stack>
                        )}
                      </Stack>
                      <Text 
                        fontSize={16} 
                        fontWeight="bold" 
                        numberOfLines={1}
                        style={{ fontFamily: 'Rajdhani, monospace' }}
                      >
                        {user.name}
                      </Text>
                      <Stack
                        paddingHorizontal="$2.5"
                        paddingVertical="$1"
                        borderRadius={6}
                        style={{
                          background: user.isInGame 
                            ? 'rgba(0, 255, 136, 0.2)'
                            : 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Text 
                          fontSize={12} 
                          color={user.isInGame ? "$neonGreen" : "$textMuted"}
                          fontWeight="bold"
                          textTransform="uppercase"
                          letterSpacing={0.5}
                        >
                          {user.isInGame ? '● LIVE' : '● ONLINE'}
                        </Text>
                      </Stack>
                    </YStack>
                  </Card>
                ))
              )}
            </XStack>
          </ScrollView>
        </YStack>
        
          </YStack>
        </Stack>
      </ScrollView>
    </Stack>
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
      minWidth={300}
      interactive={!isFull}
      onPress={!isFull || isActive ? onPress : undefined}
      opacity={isFull && !isActive ? 0.6 : 1}
      padding="$5"
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 255, 136, 0.08) 100%)' 
          : 'linear-gradient(135deg, rgba(18, 18, 26, 0.9) 0%, rgba(10, 10, 15, 0.9) 100%)',
        borderColor: isActive ? '#00FF88' : 'rgba(0, 212, 255, 0.2)',
        borderWidth: isActive ? 2 : 1,
        boxShadow: isActive 
          ? '0 0 30px rgba(0, 255, 136, 0.3), inset 0 0 20px rgba(0, 255, 136, 0.1)'
          : '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap="$2" flex={1}>
            <Text 
              fontSize={20} 
              fontWeight="900" 
              numberOfLines={1}
              style={{ fontFamily: 'Rajdhani, monospace' }}
              color={isActive ? "$neonGreen" : "$text"}
            >
              {game.name}
            </Text>
            <XStack gap="$3" alignItems="center">
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$1"
                backgroundColor="rgba(0, 212, 255, 0.1)"
                borderRadius="$xs"
                borderWidth={1}
                borderColor="rgba(0, 212, 255, 0.3)"
              >
                <Text fontSize="$xs" color="$neonBlue" fontWeight="bold">
                  {game.board_size || game.boardSize}×{game.board_size || game.boardSize}
                </Text>
              </Stack>
              <XStack gap="$1" alignItems="center">
                <Users size={14} color={isFull ? "#FF0080" : "#00D4FF"} />
                <Text 
                  fontSize="$sm" 
                  color={isFull ? "$neonPink" : "$neonBlue"}
                  fontWeight="bold"
                >
                  {game.playerCount || game.player_count || 0}/{game.max_players || game.maxPlayers}
                </Text>
              </XStack>
            </XStack>
          </YStack>

          {isActive ? (
            <Stack
              paddingHorizontal="$3"
              paddingVertical="$1.5"
              borderRadius={8}
              style={{
                background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
              }}
            >
              <Text fontSize="$xs" fontWeight="900" color="$black" textTransform="uppercase">
                LIVE
              </Text>
            </Stack>
          ) : isFull ? (
            <Stack
              paddingHorizontal="$3"
              paddingVertical="$1.5"
              backgroundColor="$neonPink"
              borderRadius={8}
              style={{
                boxShadow: '0 0 15px rgba(255, 0, 128, 0.5)',
              }}
            >
              <Text fontSize="$xs" fontWeight="900" color="$white" textTransform="uppercase">
                FULL
              </Text>
            </Stack>
          ) : (
            <Stack
              paddingHorizontal="$3"
              paddingVertical="$1.5"
              borderRadius={8}
              style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
                boxShadow: '0 0 15px rgba(0, 212, 255, 0.5)',
              }}
            >
              <Text fontSize="$xs" fontWeight="900" color="$white" textTransform="uppercase">
                OPEN
              </Text>
            </Stack>
          )}
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <Stack
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor="rgba(255, 255, 255, 0.05)"
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="rgba(255, 255, 255, 0.1)"
            >
              <Text fontSize="$sm" fontWeight="bold">
                {(game.creatorName || game.creator_name || 'Unknown').charAt(0).toUpperCase()}
              </Text>
            </Stack>
            <Text fontSize="$sm" color="$textMuted">
              {game.creatorName || game.creator_name || 'Unknown'}
            </Text>
          </XStack>

          {!isFull && !isActive && (
            <Button 
              size="$3" 
              onPress={onPress}
              style={{
                paddingHorizontal: 24,
                fontWeight: 'bold',
              }}
            >
              JOIN
            </Button>
          )}

          {isActive && (
            <Button 
              size="$3" 
              onPress={onPress}
              style={{
                paddingHorizontal: 20,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
              }}
            >
              CONTINUE
            </Button>
          )}
        </XStack>
      </YStack>
    </Card>
  );
}

// Import Trophy component
import { Trophy } from 'lucide-react';