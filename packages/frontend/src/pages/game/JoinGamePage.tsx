import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { YStack, XStack, Stack, Text, ScrollView, Tabs, Spinner } from 'tamagui';
import { Search, Hash, RefreshCw } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { soundManager } from '@/utils/sound/soundManager';
import { useGameList, useJoinGame, useJoinGameByCode } from '@/hooks/useGame';
import { GAME_STATUS, type GameListItem } from '@socket-game/shared';
import { routes } from '@/routes';

export function JoinGamePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch public games (waiting status)
  const { data: gamesData, isLoading, refetch } = useGameList({ 
    status: GAME_STATUS.WAITING, 
    limit: 20 
  });
  
  // Join game mutations
  const joinGameMutation = useJoinGame();
  const joinByCodeMutation = useJoinGameByCode();
  
  const publicGames = gamesData?.games || [];

  const handleJoinByCode = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 8) {
      return;
    }

    soundManager.play('playerJoin');
    joinByCodeMutation.mutate(inviteCode);
  };

  const handleJoinPublicGame = async (gameId: string) => {
    soundManager.play('playerJoin');
    joinGameMutation.mutate(gameId);
  };

  const filteredGames = publicGames.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={800} margin="0 auto" width="100%">
        <YStack gap="$2">
          <Text fontSize="$2xl" fontWeight="bold">
            Join a Game
          </Text>
          <Text color="$textMuted">
            Enter an invite code or browse public games
          </Text>
        </YStack>

        <Tabs
          defaultValue="browse"
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="horizontal"
          flexDirection="column"
          flex={1}
        >
          <Tabs.List backgroundColor="$surface" borderRadius="$lg" padding="$1">
            <Tabs.Trigger value="browse" flex={1}>
              <Text>Browse Games</Text>
            </Tabs.Trigger>
            <Tabs.Trigger value="code" flex={1}>
              <Text>Join by Code</Text>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="browse" paddingTop="$4">
            <YStack gap="$4">
              <XStack gap="$2" flex={1} alignItems="center">
                <Search size={20} color="$textMuted" />
                <Input
                  placeholder="Search games..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  flex={1}
                />
              </XStack>

              {/* Refresh Button */}
              <XStack justifyContent="flex-end">
                <Button
                  size="$2"
                  variant="ghost"
                  onPress={() => refetch()}
                  disabled={isLoading}
                  icon={<RefreshCw size={16} />}
                >
                  Refresh
                </Button>
              </XStack>

              <ScrollView maxHeight={500}>
                <YStack gap="$3">
                  {isLoading ? (
                    <Card padding="$8" alignItems="center">
                      <Spinner size="large" color="$neonBlue" />
                      <Text color="$textMuted" marginTop="$4">Loading games...</Text>
                    </Card>
                  ) : filteredGames.length === 0 ? (
                    <Card padding="$8" alignItems="center">
                      <Text color="$textMuted">
                        {searchQuery ? 'No games match your search' : 'No public games available'}
                      </Text>
                      {!searchQuery && (
                        <Button
                          marginTop="$4"
                          variant="secondary"
                          onPress={() => navigate(routes.createGame)}
                        >
                          Create a Game
                        </Button>
                      )}
                    </Card>
                  ) : (
                    filteredGames.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onJoin={() => handleJoinPublicGame(game.id)}
                        isJoining={joinGameMutation.isPending && joinGameMutation.variables === game.id}
                      />
                    ))
                  )}
                </YStack>
              </ScrollView>
            </YStack>
          </Tabs.Content>

          <Tabs.Content value="code" paddingTop="$4">
            <Card variant="elevated" padding="$6" gap="$4">
              <YStack gap="$2" alignItems="center">
                <Stack
                  width={80}
                  height={80}
                  backgroundColor="$neonBlue"
                  borderRadius={40}
                  alignItems="center"
                  justifyContent="center"
                  opacity={0.2}
                  marginBottom="$4"
                >
                  <Hash size={40} color="$neonBlue" />
                </Stack>
                
                <Text fontSize="$lg" fontWeight="bold" textAlign="center">
                  Have an invite code?
                </Text>
                <Text color="$textMuted" textAlign="center">
                  Enter the 8-character code to join a private game
                </Text>
              </YStack>

              <Input
                placeholder="Enter code (e.g., ABCD1234)"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                fullWidth
                maxLength={8}
                style={{
                  textAlign: 'center',
                  fontSize: 20,
                  fontFamily: 'monospace',
                  letterSpacing: 4,
                }}
              />

              <Button
                size="$5"
                onPress={handleJoinByCode}
                loading={joinByCodeMutation.isPending}
                disabled={inviteCode.length !== 8 || joinByCodeMutation.isPending}
                fullWidth
              >
                Join Game
              </Button>
            </Card>
          </Tabs.Content>
        </Tabs>
      </YStack>
    </YStack>
  );
}

function GameCard({ game, onJoin, isJoining }: { 
  game: GameListItem; 
  onJoin: () => void;
  isJoining?: boolean;
}) {
  const spotsLeft = game.maxPlayers - game.playerCount;
  const isFull = spotsLeft === 0;

  return (
    <Card
      interactive={!isFull}
      onPress={!isFull ? onJoin : undefined}
      opacity={isFull ? 0.6 : 1}
      variant="outlined"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack gap="$2" flex={1}>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$lg" fontWeight="bold">{game.name}</Text>
            {isFull && (
              <Text
                fontSize="$xs"
                color="$error"
                backgroundColor="rgba(255, 0, 68, 0.1)"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$sm"
              >
                FULL
              </Text>
            )}
          </XStack>
          
          <XStack gap="$4">
            <XStack gap="$1">
              <Text color="$textMuted" fontSize="$sm">Board:</Text>
              <Text color="$neonBlue" fontSize="$sm" fontWeight="bold">
                {game.boardSize}x{game.boardSize}
              </Text>
            </XStack>
            
            <XStack gap="$1">
              <Text color="$textMuted" fontSize="$sm">Players:</Text>
              <Text 
                color={isFull ? '$error' : '$success'} 
                fontSize="$sm" 
                fontWeight="bold"
              >
                {game.playerCount}/{game.maxPlayers}
              </Text>
            </XStack>
            
            <XStack gap="$1">
              <Text color="$textMuted" fontSize="$sm">Host:</Text>
              <Text fontSize="$sm">{game.creatorName}</Text>
            </XStack>
          </XStack>
        </YStack>

        {!isFull && (
          <Button
            size="$3"
            variant="secondary"
            onPress={onJoin}
            loading={isJoining}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join'}
          </Button>
        )}
      </XStack>
    </Card>
  );
}