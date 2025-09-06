import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YStack, XStack, Stack, Text, ScrollView, Avatar, Spinner } from 'tamagui';
import { Copy, Crown, CheckCircle, Clock, MessageSquare, Send } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { soundManager } from '@/utils/sound/soundManager';
import { useGameDetails, useStartGame, useLeaveGame, useGameSubscription } from '@/hooks/useGame';
import { useGameStore } from '@/stores/game.store';
import { gameSocket } from '@/lib/socket';
import {
  PLAYER_COLORS,
  GAME_STATUS,
  type Player,
  type ChatMessage as WSChatMessage,
} from '@socket-game/shared';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export function GameRoomPage() {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuthStore();
  const [localReadyStates, setLocalReadyStates] = useState<Record<string, boolean>>({});
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // API hooks
  const { data: gameDetails, isLoading, error } = useGameDetails(gameId!);
  const startGameMutation = useStartGame();
  const leaveGameMutation = useLeaveGame();

  // Subscribe to WebSocket updates
  useGameSubscription(gameId!);

  // Get current game from store (updated by WebSocket)
  const currentGame = useGameStore((state) => state.currentGame);
  
  // Set up chat message listener
  useEffect(() => {
    if (!gameId) return;
    
    const handleChatMessage = (message: WSChatMessage) => {
      if (message.gameId === gameId) {
        const newMessage: ChatMessage = {
          id: `${message.userId}-${message.timestamp}`,
          userId: message.userId,
          userName: message.userName,
          message: message.message,
          timestamp: new Date(message.timestamp),
        };
        setChatMessages(prev => [...prev, newMessage]);
        soundManager.play('cellClick');
      }
    };

    gameSocket.on('chatMessage', handleChatMessage);
    
    return () => {
      gameSocket.off('chatMessage', handleChatMessage);
    };
  }, [gameId]);
  
  // Set up ready state listener
  useEffect(() => {
    if (!gameId) return;
    
    const handlePlayerReadyState = (data: { gameId: string; userId: string; isReady: boolean }) => {
      if (data.gameId === gameId) {
        setLocalReadyStates(prev => ({
          ...prev,
          [data.userId]: data.isReady
        }));
      }
    };

    gameSocket.on('playerReadyState', handlePlayerReadyState);
    
    return () => {
      gameSocket.off('playerReadyState', handlePlayerReadyState);
    };
  }, [gameId]);
  
  // Use WebSocket data if available, otherwise use API data
  const game = currentGame || gameDetails;
  
  // Ensure game has required structure
  if (game && !game.players) {
    game.players = [];
  }

  const currentPlayer = game?.players?.find(p => p.userId === user?.id);
  const isHost = game?.creator?.id === user?.id || game?.creator_id === user?.id;
  
  // Merge ready states from API and WebSocket
  const getPlayerReadyState = (playerId: string) => {
    if (localReadyStates[playerId] !== undefined) {
      return localReadyStates[playerId];
    }
    const player = game?.players?.find(p => p.userId === playerId);
    return player?.isReady || false;
  };
  
  const isReady = user?.id ? getPlayerReadyState(user.id) : false;
  const allPlayersReady = game?.players?.every(p => getPlayerReadyState(p.userId)) || false;
  const canStartGame = isHost && allPlayersReady && (game?.players?.length || 0) >= 2;

  // Redirect if game has started
  useEffect(() => {
    if (game?.status === GAME_STATUS.IN_PROGRESS) {
      navigate(`/game/${gameId}/play`);
    }
  }, [game?.status, gameId, navigate]);

  const handleReady = () => {
    if (gameId && user?.id) {
      const newReadyState = !isReady;
      // Update local state immediately for responsiveness
      setLocalReadyStates(prev => ({
        ...prev,
        [user.id]: newReadyState
      }));
      // Send to server
      gameSocket.setPlayerReady(gameId, newReadyState);
      soundManager.play('cellClick');
    }
  };

  const handleStartGame = () => {
    if (canStartGame && gameId) {
      soundManager.play('gameStart');
      startGameMutation.mutate(gameId);
    }
  };

  const handleLeaveGame = () => {
    if (gameId) {
      leaveGameMutation.mutate(gameId);
    }
  };

  const copyInviteCode = () => {
    if (game?.invite_code) {
      navigator.clipboard.writeText(game.invite_code);
      soundManager.play('cellClick');
      // TODO: Show toast notification
    }
  };

  const sendChatMessage = () => {
    if (chatMessage.trim() && gameId) {
      // Send message via WebSocket
      gameSocket.sendChatMessage(gameId, chatMessage);
      setChatMessage('');
    }
  };

  if (isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$neonBlue" />
        <Text marginTop="$4" color="$textMuted">Loading game...</Text>
      </Stack>
    );
  }

  if (error || !game) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize="$xl" color="$error">Game not found</Text>
        <Button marginTop="$4" onPress={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Stack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView 
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <Stack flex={1} alignItems="center" width="100%">
          <YStack padding="$5" space="$5" width="100%" maxWidth={1200}>
          {/* Game Header */}
          <Card variant="elevated" padding="$4">
            <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" space="$4">
              <YStack space="$2">
                <Text fontSize="$2xl" fontWeight="bold">{game.name}</Text>
                <XStack space="$4">
                  <XStack space="$1">
                    <Text color="$textMuted">Board:</Text>
                    <Text color="$neonBlue" fontWeight="bold">{game.boardSize || game.board_size}x{game.boardSize || game.board_size}</Text>
                  </XStack>
                  <XStack space="$1">
                    <Text color="$textMuted">Players:</Text>
                    <Text color="$neonGreen" fontWeight="bold">{game.players?.length || 0}/{game.max_players || game.maxPlayers}</Text>
                  </XStack>
                </XStack>
              </YStack>
              
              <Card
                interactive
                onPress={copyInviteCode}
                backgroundColor="$surface"
                padding="$3"
                borderWidth={2}
                borderColor="$neonBlue"
                borderStyle="dashed"
              >
                <XStack space="$2" alignItems="center">
                  <Text fontSize="$sm" color="$textMuted">Invite Code:</Text>
                  <Text fontSize="$lg" fontWeight="bold" color="$neonBlue" fontFamily="monospace">
                    {game.invite_code}
                  </Text>
                  <Copy size={16} color="$neonBlue" />
                </XStack>
              </Card>
            </XStack>
          </Card>

          <XStack space="$4" flexWrap="wrap">
            {/* Players Section */}
            <YStack flex={2} minWidth={300} space="$4">
              <Card variant="elevated" padding="$4" space="$4">
                <Text fontSize="$lg" fontWeight="bold">Players ({game.players?.length || 0}/{game.max_players || game.maxPlayers})</Text>
                
                <YStack space="$3">
                  {(game.players || []).map((player) => (
                    <PlayerCard 
                      key={player.userId} 
                      player={{
                        ...player,
                        isHost: player.userId === (game.creator?.id || game.creator_id),
                        isReady: getPlayerReadyState(player.userId),
                        isYou: player.userId === user?.id,
                      }} 
                    />
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: (game.max_players || game.maxPlayers || 4) - (game.players?.length || 0) }).map((_, index) => (
                    <Card
                      key={`empty-${index}`}
                      padding="$3"
                      borderStyle="dashed"
                      borderColor="$borderColor"
                      opacity={0.5}
                    >
                      <XStack space="$3" alignItems="center">
                        <Stack
                          width={48}
                          height={48}
                          borderRadius={24}
                          backgroundColor="$surface"
                          borderWidth={2}
                          borderColor="$borderColor"
                          borderStyle="dashed"
                        />
                        <Text color="$textMuted">Waiting for player...</Text>
                      </XStack>
                    </Card>
                  ))}
                </YStack>

                {/* Action Buttons */}
                <XStack space="$3" justifyContent="center">
                  {isHost ? (
                    <Button
                      size="$5"
                      onPress={handleStartGame}
                      disabled={!canStartGame || startGameMutation.isPending}
                      loading={startGameMutation.isPending}
                      fullWidth
                    >
                      {canStartGame ? 'Start Game' : `Waiting for ${allPlayersReady ? 'more players' : 'all players ready'}`}
                    </Button>
                  ) : (
                    <Button
                      size="$5"
                      variant={isReady ? 'primary' : 'secondary'}
                      onPress={handleReady}
                      fullWidth
                    >
                      {isReady ? '✓ Ready' : 'Click when Ready'}
                    </Button>
                  )}
                </XStack>
              </Card>

              <Button
                variant="danger"
                onPress={handleLeaveGame}
                loading={leaveGameMutation.isPending}
                fullWidth
              >
                Leave Game
              </Button>
            </YStack>

            {/* Chat Section */}
            <YStack flex={1} minWidth={300}>
              <Card variant="elevated" height={500} padding={0}>
                <YStack flex={1}>
                  <XStack 
                    padding="$3" 
                    borderBottomWidth={1} 
                    borderBottomColor="$borderColor"
                    alignItems="center"
                    space="$2"
                  >
                    <MessageSquare size={20} color="$neonBlue" />
                    <Text fontSize="$lg" fontWeight="bold">Game Chat</Text>
                  </XStack>
                  
                  <ScrollView 
                    flex={1} 
                    padding="$4"
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <YStack space="$3">
                      {chatMessages.map((msg) => (
                        <YStack 
                          key={msg.id} 
                          space="$1.5"
                          padding="$3"
                          borderRadius={8}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderLeft: '3px solid #00D4FF',
                          }}
                        >
                          <XStack space="$3" alignItems="baseline">
                            <Text 
                              fontSize={14} 
                              fontWeight="bold" 
                              color="$neonBlue"
                              style={{ fontFamily: 'Rajdhani, monospace' }}
                            >
                              {msg.userName}
                            </Text>
                            <Text fontSize={11} color="$textMuted" opacity={0.6}>
                              {msg.timestamp.toLocaleTimeString()}
                            </Text>
                          </XStack>
                          <Text fontSize={15} color="$text" opacity={0.9}>
                            {msg.message}
                          </Text>
                        </YStack>
                      ))}
                      
                      {chatMessages.length === 0 && (
                        <Text 
                          color="$textMuted" 
                          textAlign="center" 
                          paddingVertical="$8"
                          fontSize={16}
                          opacity={0.5}
                        >
                          No messages yet. Say hello!
                        </Text>
                      )}
                    </YStack>
                  </ScrollView>
                  
                  <XStack 
                    padding="$3" 
                    borderTopWidth={1} 
                    borderTopColor="$borderColor"
                    space="$2"
                  >
                    <Input
                      flex={1}
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChangeText={setChatMessage}
                      onSubmitEditing={sendChatMessage}
                    />
                    <Button
                      size="$3"
                      circular
                      onPress={sendChatMessage}
                      disabled={!chatMessage.trim()}
                      icon={<Send size={16} />}
                    />
                  </XStack>
                </YStack>
              </Card>
            </YStack>
          </XStack>
          </YStack>
        </Stack>
      </ScrollView>
    </YStack>
  );
}

interface ExtendedPlayer extends Player {
  isHost: boolean;
  isReady: boolean;
  isYou: boolean;
}

function PlayerCard({ player }: { player: ExtendedPlayer }) {
  return (
    <Card 
      padding="$4" 
      style={{
        background: player.isReady 
          ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(0, 255, 136, 0.04) 100%)'
          : 'rgba(255, 255, 255, 0.02)',
        borderColor: player.isReady ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        boxShadow: player.isReady 
          ? '0 0 20px rgba(0, 255, 136, 0.15)'
          : '0 4px 15px rgba(0, 0, 0, 0.3)',
      }}
    >
      <XStack space="$3" alignItems="center">
        <Stack position="relative">
          <Avatar 
            size={56} 
            circular 
            borderWidth={3} 
            style={{
              borderColor: player.color,
              boxShadow: `0 0 20px ${player.color}66`,
            }}
          >
            <Avatar.Image src={player.avatarUrl} />
            <Avatar.Fallback 
              style={{
                background: `linear-gradient(135deg, ${player.color} 0%, ${player.color}CC 100%)`,
              }}
            >
              <Text color="$white" fontWeight="900" fontSize={22}>
                {player.name[0].toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          
          {player.isHost && (
            <Stack
              position="absolute"
              top={-6}
              right={-6}
              width={26}
              height={26}
              borderRadius={13}
              alignItems="center"
              justifyContent="center"
              style={{
                background: 'linear-gradient(135deg, #FFDD00 0%, #FFA500 100%)',
                boxShadow: '0 0 15px rgba(255, 221, 0, 0.7)',
              }}
            >
              <Crown size={14} color="#000" strokeWidth={2} />
            </Stack>
          )}
        </Stack>
        
        <YStack flex={1} space="$2">
          <XStack space="$2" alignItems="center">
            <Text 
              fontWeight="900" 
              fontSize={18}
              style={{ fontFamily: 'Rajdhani, monospace' }}
            >
              {player.name}
            </Text>
            {player.isYou && (
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius={6}
                backgroundColor="rgba(0, 255, 136, 0.2)"
              >
                <Text fontSize={11} color="$neonGreen" fontWeight="bold">YOU</Text>
              </Stack>
            )}
            {player.isHost && (
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius={6}
                backgroundColor="rgba(255, 221, 0, 0.2)"
              >
                <Text fontSize={11} color="$neonYellow" fontWeight="bold">HOST</Text>
              </Stack>
            )}
          </XStack>
          
          <XStack space="$2" alignItems="center">
            <Stack
              width={14}
              height={14}
              borderRadius={7}
              style={{
                backgroundColor: player.color,
                boxShadow: `0 0 10px ${player.color}`,
              }}
            />
            <Stack
              paddingHorizontal="$2.5"
              paddingVertical="$1"
              borderRadius={6}
              style={{
                background: player.isReady 
                  ? 'rgba(0, 255, 136, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Text 
                fontSize={12} 
                color={player.isReady ? "$neonGreen" : "$textMuted"}
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                {player.isReady ? 'READY' : 'NOT READY'}
              </Text>
            </Stack>
          </XStack>
        </YStack>
        
        {player.isReady ? (
          <Stack
            width={32}
            height={32}
            borderRadius={16}
            alignItems="center"
            justifyContent="center"
            style={{
              background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
            }}
          >
            <CheckCircle size={20} color="#000" strokeWidth={3} />
          </Stack>
        ) : (
          <Stack
            width={32}
            height={32}
            borderRadius={16}
            alignItems="center"
            justifyContent="center"
            backgroundColor="rgba(255, 255, 255, 0.05)"
            borderWidth={2}
            borderColor="rgba(255, 255, 255, 0.1)"
          >
            <Clock size={20} color="$textMuted" />
          </Stack>
        )}
      </XStack>
    </Card>
  );
}