import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Stack, Text } from 'tamagui';
import { AnimatePresence } from 'tamagui';
import { soundManager } from '@/utils/sound/soundManager';
import { haptics } from '@/utils/haptics';

interface VictoryAnimationProps {
  winner: {
    name: string;
    color: string;
  } | null;
  onComplete?: () => void;
}

export function VictoryAnimation({ winner, onComplete }: VictoryAnimationProps) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (winner) {
      soundManager.play('victory');
      haptics.success();
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [winner, onComplete]);

  if (!winner) return null;

  return (
    <AnimatePresence>
      <Stack
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        alignItems="center"
        justifyContent="center"
        backgroundColor="rgba(0, 0, 0, 0.8)"
        animation="quick"
        enterStyle={{
          opacity: 0,
        }}
        exitStyle={{
          opacity: 0,
        }}
        onPress={onComplete}
      >
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          colors={[
            winner.color,
            '#FFD700',
            '#FFA500',
            '#FF69B4',
            '#00CED1',
            '#FF1493',
          ]}
        />
        
        <Stack
          animation="bouncy"
          enterStyle={{
            scale: 0,
            opacity: 0,
            y: 100,
          }}
          exitStyle={{
            scale: 0,
            opacity: 0,
            y: -100,
          }}
          alignItems="center"
          space="$4"
        >
          <Text
            fontSize="$12"
            fontWeight="bold"
            color="$white"
            textAlign="center"
            style={{
              textShadow: `0 0 40px ${winner.color}`,
              fontFamily: 'Orbitron, monospace',
            }}
          >
            VICTORY!
          </Text>
          
          <Text
            fontSize="$8"
            color={winner.color}
            textAlign="center"
            style={{
              textShadow: `0 0 20px ${winner.color}`,
            }}
          >
            {winner.name} wins!
          </Text>
          
          <Stack
            width={200}
            height={200}
            borderRadius={100}
            backgroundColor={winner.color}
            opacity={0.2}
            animation="cellular"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </Stack>
      </Stack>
    </AnimatePresence>
  );
}