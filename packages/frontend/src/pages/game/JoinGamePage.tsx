import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { YStack, XStack, Stack, Text, ScrollView, Tabs, Spinner, AnimatePresence } from 'tamagui';
import { Search, Hash, RefreshCw, Users, Gamepad2, Zap, Shield, Swords, Crown, Wifi, WifiOff, Globe } from 'lucide-react';
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
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '', '', '']);
  
  // Fetch public games (waiting status)
  const { data: gamesData, isLoading, refetch } = useGameList({ 
    status: GAME_STATUS.WAITING, 
    limit: 20 
  });
  
  // Join game mutations
  const joinGameMutation = useJoinGame();
  const joinByCodeMutation = useJoinGameByCode();
  
  const publicGames = gamesData?.games || [];

  useEffect(() => {
    // Auto-focus first input when switching to code tab
    if (activeTab === 'code') {
      setTimeout(() => {
        const firstInput = document.getElementById('code-input-0');
        firstInput?.focus();
      }, 100);
    }
  }, [activeTab]);

  const handleCodeInput = (index: number, value: string) => {
    if (value.length <= 1) {
      const newDigits = [...codeDigits];
      newDigits[index] = value.toUpperCase();
      setCodeDigits(newDigits);
      setInviteCode(newDigits.join(''));

      // Auto-focus next input
      if (value && index < 7) {
        const nextInput = document.getElementById(`code-input-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

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
    <Stack flex={1} backgroundColor="$background">
      <ScrollView 
        flex={1}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <Stack flex={1} alignItems="center" width="100%">
          <YStack padding="$5" gap="$6" width="100%" maxWidth={1200}>
            {/* Page Header */}
            <YStack gap="$3" marginBottom="$2">
              <Text 
                fontSize={48} 
                fontWeight="900"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(0, 255, 136, 0.5)',
                }}
              >
                JOIN GAME
              </Text>
              <Text 
                fontSize={18} 
                color="$textMuted" 
                opacity={0.8}
                style={{ fontFamily: 'Rajdhani, monospace' }}
              >
                Enter the arena and claim your victory
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
              <Tabs.List 
                backgroundColor="rgba(18, 18, 26, 0.8)"
                borderRadius={12}
                padding={4}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                <Tabs.Trigger value="browse" flex={1}>
                  <XStack gap="$2" alignItems="center" padding="$2">
                    <Globe size={20} />
                    <Text fontSize={16} fontWeight="bold">Public Games</Text>
                  </XStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="code" flex={1}>
                  <XStack gap="$2" alignItems="center" padding="$2">
                    <Hash size={20} />
                    <Text fontSize={16} fontWeight="bold">Private Code</Text>
                  </XStack>
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="browse" paddingTop="$5">
                <YStack gap="$4">
                  {/* Search and Refresh Bar */}
                  <XStack gap="$3" alignItems="center">
                    <Stack flex={1} position="relative">
                      <Input
                        placeholder="Search games or players..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        paddingLeft="$10"
                        size="$4"
                        style={{
                          background: 'rgba(18, 18, 26, 0.6)',
                          borderWidth: 1,
                          borderColor: 'rgba(0, 212, 255, 0.3)',
                          fontSize: 16,
                        }}
                      />
                      <Stack position="absolute" left="$3" top="50%" style={{ transform: 'translateY(-50%)' }}>
                        <Search size={20} color="#00D4FF" />
                      </Stack>
                    </Stack>
                    
                    <Button
                      size="$4"
                      onPress={() => refetch()}
                      disabled={isLoading}
                      style={{
                        background: 'rgba(0, 212, 255, 0.1)',
                        borderWidth: 1,
                        borderColor: 'rgba(0, 212, 255, 0.3)',
                      }}
                      icon={
                        <RefreshCw 
                          size={20} 
                          style={{
                            animation: isLoading ? 'spinnerRotate 1s linear infinite' : undefined,
                          }}
                        />
                      }
                    >
                      Refresh
                    </Button>
                  </XStack>

                  {/* Active Games Count */}
                  <XStack gap="$3" alignItems="center">
                    <Stack
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius={8}
                      style={{
                        background: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 1,
                        borderColor: 'rgba(0, 255, 136, 0.3)',
                      }}
                    >
                      <XStack gap="$2" alignItems="center">
                        <Stack
                          width={8}
                          height={8}
                          borderRadius={4}
                          backgroundColor="$neonGreen"
                          style={{
                            boxShadow: '0 0 10px #00FF88',
                            animation: 'pulse 2s infinite',
                          }}
                        />
                        <Text fontSize={14} color="$neonGreen" fontWeight="bold">
                          {filteredGames.length} GAMES AVAILABLE
                        </Text>
                      </XStack>
                    </Stack>
                    
                    <Text fontSize={14} color="$textMuted">
                      {publicGames.reduce((acc, game) => acc + (game.maxPlayers - game.playerCount), 0)} spots left
                    </Text>
                  </XStack>

                  {/* Games List */}
                  <ScrollView maxHeight={600}>
                    <YStack gap="$3">
                      {isLoading ? (
                        <Card 
                          padding="$8" 
                          alignItems="center"
                          style={{
                            background: 'rgba(18, 18, 26, 0.6)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <Stack marginBottom="$4">
                            <Gamepad2 
                              size={60} 
                              color="#00D4FF" 
                              style={{
                                animation: 'float 3s ease-in-out infinite',
                                filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.5))',
                              }}
                            />
                          </Stack>
                          <Spinner size="large" color="$neonBlue" />
                          <Text color="$textMuted" marginTop="$4" fontSize={16}>
                            Scanning for active games...
                          </Text>
                        </Card>
                      ) : filteredGames.length === 0 ? (
                        <Card 
                          padding="$8" 
                          alignItems="center"
                          style={{
                            background: 'rgba(18, 18, 26, 0.6)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <WifiOff 
                            size={60} 
                            color="#FF0080" 
                            style={{
                              marginBottom: 16,
                              filter: 'drop-shadow(0 0 20px rgba(255, 0, 128, 0.5))',
                            }}
                          />
                          <Text color="$textMuted" fontSize={18} marginBottom="$2">
                            {searchQuery ? 'No games match your search' : 'No public games available'}
                          </Text>
                          <Text color="$textMuted" fontSize={14} opacity={0.7} marginBottom="$4">
                            Be the first to create a battlefield!
                          </Text>
                          {!searchQuery && (
                            <Button
                              size="$4"
                              onPress={() => navigate(routes.createGame)}
                              style={{
                                background: 'linear-gradient(135deg, #FF0080 0%, #CC0066 100%)',
                                boxShadow: '0 4px 20px rgba(255, 0, 128, 0.4)',
                              }}
                              icon={<Zap size={20} />}
                            >
                              Create New Game
                            </Button>
                          )}
                        </Card>
                      ) : (
                        <AnimatePresence>
                          {filteredGames.map((game, index) => (
                            <GameCard
                              key={game.id}
                              game={game}
                              onJoin={() => handleJoinPublicGame(game.id)}
                              isJoining={joinGameMutation.isPending && joinGameMutation.variables === game.id}
                              index={index}
                            />
                          ))}
                        </AnimatePresence>
                      )}
                    </YStack>
                  </ScrollView>
                </YStack>
              </Tabs.Content>

              <Tabs.Content value="code" paddingTop="$5">
                <Card 
                  padding="$6" 
                  gap="$5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.9) 0%, rgba(10, 10, 15, 0.9) 100%)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 0, 128, 0.3)',
                  }}
                >
                  <YStack gap="$4" alignItems="center">
                    {/* Icon with Animation */}
                    <Stack
                      width={100}
                      height={100}
                      borderRadius={50}
                      alignItems="center"
                      justifyContent="center"
                      style={{
                        background: 'linear-gradient(135deg, #FF0080 0%, #CC0066 100%)',
                        boxShadow: '0 0 60px rgba(255, 0, 128, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                        animation: 'pulse 3s ease-in-out infinite',
                      }}
                    >
                      <Hash size={50} color="white" strokeWidth={3} />
                    </Stack>
                    
                    <YStack gap="$2" alignItems="center">
                      <Text 
                        fontSize={28} 
                        fontWeight="900" 
                        textAlign="center"
                        style={{
                          fontFamily: 'Orbitron, monospace',
                          background: 'linear-gradient(135deg, #FF0080 0%, #FF00FF 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        PRIVATE GAME CODE
                      </Text>
                      <Text 
                        color="$textMuted" 
                        textAlign="center" 
                        fontSize={16}
                        style={{ fontFamily: 'Rajdhani, monospace' }}
                      >
                        Enter the 8-character code to join a private battlefield
                      </Text>
                    </YStack>
                  </YStack>

                  {/* Code Input Grid */}
                  <XStack gap="$2" justifyContent="center">
                    {codeDigits.map((digit, index) => (
                      <React.Fragment key={index}>
                        <Input
                          id={`code-input-${index}`}
                          value={digit}
                          onChangeText={(value) => handleCodeInput(index, value)}
                          onKeyDown={(e: any) => handleKeyDown(index, e)}
                          maxLength={1}
                          size="$5"
                          style={{
                            width: 50,
                            height: 60,
                            textAlign: 'center',
                            fontSize: 24,
                            fontWeight: 'bold',
                            fontFamily: 'Orbitron, monospace',
                            background: 'rgba(255, 0, 128, 0.1)',
                            borderWidth: 2,
                            borderColor: digit ? '#FF0080' : 'rgba(255, 0, 128, 0.3)',
                            boxShadow: digit ? '0 0 20px rgba(255, 0, 128, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        />
                        {index === 3 && (
                          <Text 
                            fontSize={24} 
                            color="$textMuted" 
                            style={{ lineHeight: 60 }}
                          >
                            -
                          </Text>
                        )}
                      </React.Fragment>
                    ))}
                  </XStack>

                  {/* Progress Bar */}
                  <Stack
                    height={4}
                    backgroundColor="rgba(255, 0, 128, 0.1)"
                    borderRadius={2}
                    overflow="hidden"
                  >
                    <Stack
                      height="100%"
                      style={{
                        width: `${(inviteCode.length / 8) * 100}%`,
                        background: 'linear-gradient(90deg, #FF0080 0%, #FF00FF 100%)',
                        transition: 'width 0.3s ease',
                        boxShadow: '0 0 10px rgba(255, 0, 128, 0.6)',
                      }}
                    />
                  </Stack>

                  <Button
                    size="$5"
                    onPress={handleJoinByCode}
                    loading={joinByCodeMutation.isPending}
                    disabled={inviteCode.length !== 8 || joinByCodeMutation.isPending}
                    fullWidth
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      background: inviteCode.length === 8 
                        ? 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)'
                        : 'linear-gradient(135deg, #333333 0%, #222222 100%)',
                      boxShadow: inviteCode.length === 8 
                        ? '0 4px 20px rgba(0, 255, 136, 0.4)'
                        : 'none',
                      transition: 'all 0.3s ease',
                    }}
                    icon={<Shield size={22} />}
                  >
                    {joinByCodeMutation.isPending ? 'JOINING...' : 'ENTER BATTLEFIELD'}
                  </Button>
                </Card>
              </Tabs.Content>
            </Tabs>
          </YStack>
        </Stack>
      </ScrollView>
    </Stack>
  );
}

function GameCard({ 
  game, 
  onJoin, 
  isJoining,
  index 
}: { 
  game: GameListItem; 
  onJoin: () => void;
  isJoining?: boolean;
  index: number;
}) {
  const spotsLeft = game.maxPlayers - game.playerCount;
  const isFull = spotsLeft === 0;
  const fillPercentage = (game.playerCount / game.maxPlayers) * 100;

  // Different colors for different board sizes
  const getBoardColor = () => {
    if (game.boardSize <= 5) return '#00FF88';
    if (game.boardSize <= 7) return '#00D4FF';
    if (game.boardSize <= 10) return '#FFDD00';
    return '#FF0080';
  };

  return (
    <Card
      interactive={!isFull}
      onPress={!isFull ? onJoin : undefined}
      opacity={isFull ? 0.6 : 1}
      padding="$4"
      animation="quick"
      enterStyle={{
        x: -50,
        opacity: 0,
      }}
      x={0}
      opacity={1}
      animationDelay={index * 50}
      hoverStyle={{
        scale: !isFull ? 1.02 : 1,
        y: !isFull ? -2 : 0,
      }}
      pressStyle={{
        scale: !isFull ? 0.98 : 1,
      }}
      style={{
        background: isFull
          ? 'linear-gradient(135deg, rgba(40, 40, 50, 0.6) 0%, rgba(20, 20, 30, 0.6) 100%)'
          : 'linear-gradient(135deg, rgba(18, 18, 26, 0.8) 0%, rgba(10, 10, 15, 0.8) 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: isFull ? 'rgba(255, 0, 68, 0.3)' : 'rgba(0, 255, 136, 0.3)',
        borderStyle: 'solid',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Stack
        position="absolute"
        top={0}
        right={0}
        width={200}
        height={200}
        opacity={0.05}
        style={{
          transform: 'translate(50%, -50%)',
        }}
      >
        <Gamepad2 size={200} />
      </Stack>

      <XStack justifyContent="space-between" alignItems="center" gap="$4">
        <YStack gap="$3" flex={1}>
          {/* Game Title and Status */}
          <XStack gap="$3" alignItems="center">
            <Text 
              fontSize={22} 
              fontWeight="900"
              style={{
                fontFamily: 'Orbitron, monospace',
                textTransform: 'uppercase',
              }}
            >
              {game.name}
            </Text>
            {isFull && (
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius={6}
                style={{
                  background: 'rgba(255, 0, 68, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 0, 68, 0.4)',
                }}
              >
                <Text
                  fontSize={12}
                  color="#FF0044"
                  fontWeight="bold"
                >
                  FULL
                </Text>
              </Stack>
            )}
          </XStack>
          
          {/* Game Stats */}
          <XStack gap="$5">
            <XStack gap="$2" alignItems="center">
              <Stack
                width={32}
                height={32}
                borderRadius={6}
                alignItems="center"
                justifyContent="center"
                style={{
                  background: `${getBoardColor()}22`,
                  borderWidth: 1,
                  borderColor: `${getBoardColor()}44`,
                }}
              >
                <Swords size={16} color={getBoardColor()} />
              </Stack>
              <YStack>
                <Text fontSize={12} color="$textMuted">Board</Text>
                <Text 
                  color={getBoardColor()} 
                  fontSize={16} 
                  fontWeight="bold"
                  style={{ fontFamily: 'Orbitron, monospace' }}
                >
                  {game.boardSize}×{game.boardSize}
                </Text>
              </YStack>
            </XStack>
            
            <XStack gap="$2" alignItems="center">
              <Stack
                width={32}
                height={32}
                borderRadius={6}
                alignItems="center"
                justifyContent="center"
                style={{
                  background: 'rgba(0, 212, 255, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                }}
              >
                <Crown size={16} color="#00D4FF" />
              </Stack>
              <YStack>
                <Text fontSize={12} color="$textMuted">Host</Text>
                <Text fontSize={16}>{game.creatorName}</Text>
              </YStack>
            </XStack>
          </XStack>

          {/* Player Count Bar */}
          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <XStack gap="$2" alignItems="center">
                <Users size={16} color={isFull ? '#FF0044' : '#00FF88'} />
                <Text 
                  color={isFull ? '#FF0044' : '#00FF88'} 
                  fontSize={14} 
                  fontWeight="bold"
                >
                  {game.playerCount}/{game.maxPlayers} Players
                </Text>
              </XStack>
              {!isFull && (
                <Text fontSize={12} color="$textMuted">
                  {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                </Text>
              )}
            </XStack>
            
            {/* Progress Bar */}
            <Stack
              height={6}
              backgroundColor="rgba(255, 255, 255, 0.1)"
              borderRadius={3}
              overflow="hidden"
            >
              <Stack
                height="100%"
                style={{
                  width: `${fillPercentage}%`,
                  background: isFull 
                    ? 'linear-gradient(90deg, #FF0044 0%, #CC0033 100%)'
                    : 'linear-gradient(90deg, #00FF88 0%, #00CC6A 100%)',
                  transition: 'width 0.3s ease',
                  boxShadow: `0 0 10px ${isFull ? 'rgba(255, 0, 68, 0.6)' : 'rgba(0, 255, 136, 0.6)'}`,
                }}
              />
            </Stack>
          </YStack>
        </YStack>

        {/* Join Button */}
        {!isFull && (
          <Button
            size="$4"
            onPress={onJoin}
            loading={isJoining}
            disabled={isJoining}
            style={{
              background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
              boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
              minWidth: 120,
            }}
            icon={<Zap size={20} />}
          >
            {isJoining ? 'JOINING...' : 'JOIN'}
          </Button>
        )}
      </XStack>
    </Card>
  );
}