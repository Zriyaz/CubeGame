import { useState } from 'react';
import { YStack, XStack, Stack, Text, RadioGroup, Label } from 'tamagui';
import { Button, Card, Input } from '@/components/ui';
import { soundManager } from '@/utils/sound/soundManager';
import { useCreateGame } from '@/hooks/useGame';
import { GAME_CONFIG } from '@socket-game/shared';

const BOARD_SIZES = [
  { value: String(GAME_CONFIG.MIN_BOARD_SIZE), label: `${GAME_CONFIG.MIN_BOARD_SIZE}x${GAME_CONFIG.MIN_BOARD_SIZE}`, recommended: 'Quick game' },
  { value: String(GAME_CONFIG.DEFAULT_BOARD_SIZE), label: `${GAME_CONFIG.DEFAULT_BOARD_SIZE}x${GAME_CONFIG.DEFAULT_BOARD_SIZE}`, recommended: 'Standard' },
  { value: '12', label: '12x12', recommended: 'Extended' },
  { value: String(GAME_CONFIG.MAX_BOARD_SIZE), label: `${GAME_CONFIG.MAX_BOARD_SIZE}x${GAME_CONFIG.MAX_BOARD_SIZE}`, recommended: 'Epic battle' },
];

const PLAYER_COUNTS = Array.from(
  { length: GAME_CONFIG.MAX_PLAYERS - GAME_CONFIG.MIN_PLAYERS + 1 },
  (_, i) => GAME_CONFIG.MIN_PLAYERS + i
);

export function CreateGamePage() {
  const [gameName, setGameName] = useState('');
  const [boardSize, setBoardSize] = useState(String(GAME_CONFIG.DEFAULT_BOARD_SIZE));
  const [maxPlayers, setMaxPlayers] = useState(GAME_CONFIG.DEFAULT_MAX_PLAYERS);
  const [gameMode, setGameMode] = useState('private');

  const createGameMutation = useCreateGame();

  const handleCreateGame = async () => {
    if (!gameName.trim()) {
      // TODO: Show error toast
      return;
    }

    soundManager.play('gameStart');

    createGameMutation.mutate({
      name: gameName,
      boardSize: parseInt(boardSize),
      maxPlayers,
    });
  };

  return (
    <Stack flex={1} backgroundColor="$background" position="relative">
      {/* Animated background */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.03}
        pointerEvents="none"
      >
        <Stack
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.3) 0%, transparent 40%),
              radial-gradient(circle at 80% 60%, rgba(255, 0, 255, 0.3) 0%, transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(0, 255, 136, 0.3) 0%, transparent 40%)
            `,
            animation: 'bgFloat 20s ease-in-out infinite',
          }}
          width="100%"
          height="100%"
        />
      </Stack>

      <YStack flex={1} padding="$5" space="$6" maxWidth={800} alignSelf="center" width="100%">
        <YStack space="$3" alignItems="center">
          <Text
            fontSize={48}
            fontWeight="900"
            textAlign="center"
            style={{
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(135deg, #00D4FF 0%, #00F0FF 50%, #00D4FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(0, 212, 255, 0.5)',
              letterSpacing: 2,
            }}
          >
            CREATE NEW GAME
          </Text>
          <Text
            color="$textMuted"
            fontSize={18}
            textAlign="center"
            opacity={0.8}
          >
            Set up your battlefield and invite players to join
          </Text>
        </YStack>

        <Card
          padding="$6"
          space="$5"
          style={{
            background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Game Name */}
          <YStack space="$3">
            <Text
              fontSize={20}
              fontWeight="bold"
              color="$neonCyan"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              GAME NAME
            </Text>
            <Input
              placeholder="Epic Grid Battle"
              value={gameName}
              onChangeText={setGameName}
              fullWidth
              maxLength={50}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderColor: 'rgba(0, 212, 255, 0.3)',
                fontSize: 18,
                paddingVertical: 16,
              }}
            />
          </YStack>

          {/* Board Size */}
          <YStack space="$3">
            <Text
              fontSize={20}
              fontWeight="bold"
              color="$neonCyan"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              BOARD SIZE
            </Text>
            <XStack space="$3" flexWrap="wrap" justifyContent="center">
              {BOARD_SIZES.map((size) => (
                <BoardSizeOption
                  key={size.value}
                  {...size}
                  selected={boardSize === size.value}
                  onSelect={() => setBoardSize(size.value)}
                />
              ))}
            </XStack>
          </YStack>

          {/* Max Players */}
          <YStack space="$3">
            <Text
              fontSize={20}
              fontWeight="bold"
              color="$neonCyan"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              MAX PLAYERS
            </Text>
            <XStack space="$3" flexWrap="wrap" justifyContent="center">
              {PLAYER_COUNTS.map((count) => (
                <PlayerCountOption
                  key={count}
                  count={count}
                  selected={maxPlayers === count}
                  onSelect={() => setMaxPlayers(count)}
                />
              ))}
            </XStack>
          </YStack>

          {/* Game Mode */}
          <YStack space="$3">
            <Text
              fontSize={20}
              fontWeight="bold"
              color="$neonCyan"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              GAME MODE
            </Text>
            <RadioGroup value={gameMode} onValueChange={setGameMode}>
              <YStack space="$3">
                <Label
                  htmlFor="public"
                  padding="$4"
                  borderRadius={12}
                  cursor="pointer"
                  style={{
                    background: gameMode === 'public'
                      ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.08) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: gameMode === 'public'
                      ? '2px solid rgba(0, 212, 255, 0.5)'
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: gameMode === 'public'
                      ? '0 0 20px rgba(0, 212, 255, 0.3)'
                      : 'none',
                  }}
                >
                  <XStack space="$4" alignItems="center">
                    <RadioGroup.Item value="public" id="public" size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <YStack>
                      <Text fontSize={18} fontWeight="bold">PUBLIC GAME</Text>
                      <Text fontSize={14} color="$textMuted">
                        Anyone can join from the lobby
                      </Text>
                    </YStack>
                  </XStack>
                </Label>

                <Label
                  htmlFor="private"
                  padding="$4"
                  borderRadius={12}
                  cursor="pointer"
                  style={{
                    background: gameMode === 'private'
                      ? 'linear-gradient(135deg, rgba(255, 0, 128, 0.15) 0%, rgba(255, 0, 128, 0.08) 100%)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: gameMode === 'private'
                      ? '2px solid rgba(255, 0, 128, 0.5)'
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: gameMode === 'private'
                      ? '0 0 20px rgba(255, 0, 128, 0.3)'
                      : 'none',
                  }}
                >
                  <XStack space="$4" alignItems="center">
                    <RadioGroup.Item value="private" id="private" size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <YStack>
                      <Text fontSize={18} fontWeight="bold">PRIVATE GAME</Text>
                      <Text fontSize={14} color="$textMuted">
                        Invite only with secret code
                      </Text>
                    </YStack>
                  </XStack>
                </Label>
              </YStack>
            </RadioGroup>
          </YStack>
        </Card>

        {/* Create Button */}
        <Button
          size="$6"
          onPress={handleCreateGame}
          loading={createGameMutation.isPending}
          disabled={!gameName.trim() || createGameMutation.isPending}
          fullWidth
          style={{
            paddingVertical: 20,
            fontSize: 20,
            fontWeight: '900',
            background: !gameName.trim()
              ? 'linear-gradient(135deg, #333333 0%, #222222 100%)'
              : 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
            boxShadow: gameName.trim()
              ? '0 4px 30px rgba(0, 255, 136, 0.5)'
              : 'none',
            textTransform: 'uppercase',
            letterSpacing: 2,
            fontFamily: 'Orbitron, monospace',
          }}
        >
          CREATE GAME
        </Button>
      </YStack>
    </Stack>
  );
}

function BoardSizeOption({
  value,
  label,
  recommended,
  selected,
  onSelect
}: {
  value: string;
  label: string;
  recommended: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      interactive
      onPress={onSelect}
      padding="$4"
      minWidth={140}
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 212, 255, 0.08) 100%)'
          : 'rgba(255, 255, 255, 0.02)',
        borderColor: selected ? '#00D4FF' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        boxShadow: selected
          ? '0 0 25px rgba(0, 212, 255, 0.4), inset 0 0 15px rgba(0, 212, 255, 0.2)'
          : '0 4px 15px rgba(0, 0, 0, 0.3)',
      }}
    >
      <YStack alignItems="center" space="$2">
        <Text
          fontSize={24}
          fontWeight="900"
          color={selected ? '$neonBlue' : '$white'}
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          {label}
        </Text>
        <Stack
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius={6}
          style={{
            background: selected
              ? 'rgba(0, 212, 255, 0.2)'
              : 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Text
            fontSize={12}
            color={selected ? '$neonBlue' : '$textMuted'}
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {recommended}
          </Text>
        </Stack>
      </YStack>
    </Card>
  );
}

function PlayerCountOption({
  count,
  selected,
  onSelect
}: {
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Stack
      width={64}
      height={64}
      borderRadius={12}
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      animation="quick"
      onPress={onSelect}
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%)'
          : 'rgba(255, 255, 255, 0.02)',
        borderWidth: 2,
        borderColor: selected ? '#00FF88' : 'rgba(255, 255, 255, 0.1)',
        boxShadow: selected
          ? '0 0 20px rgba(0, 255, 136, 0.4), inset 0 0 10px rgba(0, 255, 136, 0.2)'
          : '0 4px 10px rgba(0, 0, 0, 0.3)',
      }}
      hoverStyle={{
        scale: 1.1,
        borderColor: selected ? '$neonGreen' : '$neonBlue',
      }}
      pressStyle={{
        scale: 0.95,
      }}
    >
      <Text
        fontSize={28}
        fontWeight="900"
        color={selected ? '$neonGreen' : '$white'}
        style={{ fontFamily: 'Orbitron, monospace' }}
      >
        {count}
      </Text>
    </Stack>
  );
}