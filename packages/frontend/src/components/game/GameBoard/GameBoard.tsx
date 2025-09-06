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
      backgroundColor="rgba(5, 5, 7, 0.95)"
      borderRadius={20}
      padding="$5"
      animation="lazy"
      position="relative"
      enterStyle={{
        opacity: 0,
        scale: 0.9,
      }}
      style={{
        background: 'linear-gradient(145deg, rgba(10, 10, 15, 0.95) 0%, rgba(18, 18, 26, 0.95) 100%)',
        boxShadow: `
          0 0 80px rgba(0, 212, 255, 0.15),
          0 0 40px rgba(0, 212, 255, 0.1),
          inset 0 0 60px rgba(0, 212, 255, 0.05),
          0 10px 40px rgba(0, 0, 0, 0.8)
        `,
        border: '2px solid rgba(0, 212, 255, 0.2)',
      }}
    >
      {/* Grid background effect */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          backgroundPosition: 'center',
          borderRadius: 18,
        }}
      />
      
      <YStack
        ref={animationParent}
        space={2}
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        {Array.from({ length: size }).map((_, row) => (
          <XStack key={row} space={2}>
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