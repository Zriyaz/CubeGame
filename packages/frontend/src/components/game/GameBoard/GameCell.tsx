import { Stack, AnimatePresence } from 'tamagui';
import Ripples from 'react-ripples';
import { memo, useCallback } from 'react';
import { soundManager } from '@/utils/sound/soundManager';
import { haptics } from '@/utils/haptics';

interface GameCellProps {
  x: number;
  y: number;
  ownerId?: string;
  color?: string;
  isCurrentPlayer: boolean;
  isHoverable?: boolean;
  onClick: (x: number, y: number) => void;
  size?: number;
}

export const GameCell = memo(({
  x,
  y,
  ownerId,
  color,
  isCurrentPlayer,
  isHoverable = true,
  onClick,
  size = 60,
}: GameCellProps) => {
  const handleClick = useCallback(() => {
    if (isCurrentPlayer && !ownerId) {
      // Play sound effect
      soundManager.play('cellClick');
      
      // Haptic feedback on mobile
      haptics.light();
      
      // Trigger click handler
      onClick(x, y);
    }
  }, [isCurrentPlayer, ownerId, onClick, x, y]);

  const canInteract = isCurrentPlayer && !ownerId;

  return (
    <Ripples 
      color={color || 'rgba(0, 255, 255, 0.5)'} 
      during={600}
    >
      <Stack
        width={size}
        height={size}
        backgroundColor={ownerId ? color : '$cellEmpty'}
        borderColor={ownerId ? color : '$gridLine'}
        borderWidth={2}
        borderRadius="$cell"
        cursor={canInteract ? 'pointer' : 'default'}
        animation="cellular"
        position="relative"
        onPress={handleClick}
        hoverStyle={isHoverable && canInteract ? {
          scale: 1.05,
          borderColor: '$neonBlue',
          backgroundColor: '$cellHover',
          borderWidth: 2,
          shadowColor: '$neonBlue',
          shadowRadius: 10,
          shadowOpacity: 0.5,
        } : {}}
        pressStyle={canInteract ? {
          scale: 0.95,
        } : {}}
        style={{
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <AnimatePresence>
          {ownerId && (
            <Stack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              animation="quick"
              enterStyle={{
                scale: 0,
                opacity: 0,
                rotate: '180deg',
              }}
              exitStyle={{
                scale: 0,
                opacity: 0,
                rotate: '-180deg',
              }}
              style={{
                background: `radial-gradient(circle at center, ${color}33 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Glow effect for owned cells */}
        {ownerId && (
          <Stack
            position="absolute"
            top={-2}
            left={-2}
            right={-2}
            bottom={-2}
            borderRadius="$cell"
            style={{
              background: `radial-gradient(circle at center, ${color}22 0%, transparent 100%)`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </Stack>
    </Ripples>
  );
});

GameCell.displayName = 'GameCell';