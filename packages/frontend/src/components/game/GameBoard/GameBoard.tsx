import { Stack, XStack, YStack } from 'tamagui';
import { GameCell } from './GameCell';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { memo, useCallback } from 'react';
import { soundManager } from '@/utils/sound/soundManager';

interface BoardCell {
  ownerId?: string;
  color?: string;
}

interface GameBoardProps {
  size: number;
  board: BoardCell[][];
  currentPlayerId: string;
  onCellClick: (x: number, y: number) => void;
  cellSize?: number;
}

export const GameBoard = memo(({
  size,
  board,
  currentPlayerId,
  onCellClick,
  cellSize = 60,
}: GameBoardProps) => {
  const [animationParent] = useAutoAnimate();
  
  const handleCellClick = useCallback((x: number, y: number) => {
    soundManager.play('cellCapture');
    onCellClick(x, y);
  }, [onCellClick]);

  return (
    <Stack
      backgroundColor="$gameBackground"
      borderRadius="$board"
      padding="$4"
      elevation="$4"
      animation="lazy"
      enterStyle={{
        opacity: 0,
        scale: 0.9,
      }}
      style={{
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.2)',
      }}
    >
      <YStack
        ref={animationParent}
        space="$1"
        alignItems="center"
        justifyContent="center"
      >
        {Array.from({ length: size }).map((_, row) => (
          <XStack key={row} space="$1">
            {Array.from({ length: size }).map((_, col) => (
              <GameCell
                key={`${row}-${col}`}
                x={col}
                y={row}
                ownerId={board[row]?.[col]?.ownerId}
                color={board[row]?.[col]?.color}
                isCurrentPlayer={!!currentPlayerId}
                onClick={handleCellClick}
                size={cellSize}
              />
            ))}
          </XStack>
        ))}
      </YStack>
      
      {/* Grid glow effect */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderRadius="$board"
        pointerEvents="none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
          animation: 'breathe 4s ease-in-out infinite',
        }}
      />
    </Stack>
  );
});

GameBoard.displayName = 'GameBoard';