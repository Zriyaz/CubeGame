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
    <YStack flex={1} padding="$4" space="$6" maxWidth={600} alignSelf="center" width="100%">
      <YStack space="$2">
        <Text fontSize="$2xl" fontWeight="bold">
          Create New Game
        </Text>
        <Text color="$textMuted">
          Set up your battlefield and invite players to join
        </Text>
      </YStack>

      <Card variant="elevated" space="$4">
        {/* Game Name */}
        <Input
          label="Game Name"
          placeholder="Epic Grid Battle"
          value={gameName}
          onChangeText={setGameName}
          fullWidth
          maxLength={50}
        />

        {/* Board Size */}
        <YStack space="$2">
          <Text fontSize="$base" color="$textMuted">
            Board Size
          </Text>
          <XStack space="$2" flexWrap="wrap">
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
        <YStack space="$2">
          <Text fontSize="$base" color="$textMuted">
            Max Players
          </Text>
          <XStack space="$2" flexWrap="wrap">
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
        <YStack space="$2">
          <Text fontSize="$base" color="$textMuted">
            Game Mode
          </Text>
          <RadioGroup value={gameMode} onValueChange={setGameMode}>
            <YStack space="$2">
              <Label
                htmlFor="public"
                paddingVertical="$2"
                paddingHorizontal="$3"
                borderRadius="$md"
                backgroundColor={gameMode === 'public' ? '$surfaceHover' : 'transparent'}
                cursor="pointer"
              >
                <XStack space="$3" alignItems="center">
                  <RadioGroup.Item value="public" id="public" size="$3">
                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                  <YStack>
                    <Text>Public</Text>
                    <Text fontSize="$sm" color="$textMuted">
                      Anyone can join
                    </Text>
                  </YStack>
                </XStack>
              </Label>

              <Label
                htmlFor="private"
                paddingVertical="$2"
                paddingHorizontal="$3"
                borderRadius="$md"
                backgroundColor={gameMode === 'private' ? '$surfaceHover' : 'transparent'}
                cursor="pointer"
              >
                <XStack space="$3" alignItems="center">
                  <RadioGroup.Item value="private" id="private" size="$3">
                    <RadioGroup.Indicator />
                  </RadioGroup.Item>
                  <YStack>
                    <Text>Private</Text>
                    <Text fontSize="$sm" color="$textMuted">
                      Invite only
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
        size="$5"
        onPress={handleCreateGame}
        loading={createGameMutation.isPending}
        disabled={!gameName.trim() || createGameMutation.isPending}
        fullWidth
      >
        Create Game
      </Button>
    </YStack>
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
      variant={selected ? 'elevated' : 'outlined'}
      interactive
      onPress={onSelect}
      padding="$3"
      minWidth={120}
      borderColor={selected ? '$neonBlue' : '$borderColor'}
      backgroundColor={selected ? '$surfaceHover' : '$surface'}
    >
      <YStack alignItems="center" space="$1">
        <Text fontSize="$lg" fontWeight="bold" color={selected ? '$neonBlue' : '$white'}>
          {label}
        </Text>
        <Text fontSize="$xs" color="$textMuted">
          {recommended}
        </Text>
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
      width={48}
      height={48}
      borderRadius="$md"
      borderWidth={2}
      borderColor={selected ? '$neonBlue' : '$borderColor'}
      backgroundColor={selected ? '$surfaceHover' : '$surface'}
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      animation="quick"
      onPress={onSelect}
      hoverStyle={{
        borderColor: '$neonBlue',
        scale: 1.05,
      }}
      pressStyle={{
        scale: 0.95,
      }}
    >
      <Text fontWeight="bold" color={selected ? '$neonBlue' : '$white'}>
        {count}
      </Text>
    </Stack>
  );
}