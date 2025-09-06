import { Stack, styled } from 'tamagui';
import type { ComponentProps } from 'react';

type StackProps = ComponentProps<typeof Stack>;

export interface CardProps extends StackProps {
  variant?: 'default' | 'elevated' | 'outlined';
  interactive?: boolean;
}

export const Card = styled(Stack, {
  name: 'Card',
  backgroundColor: '$surface',
  borderRadius: 12,
  padding: '$4',
  animation: 'lazy',
  position: 'relative',
  overflow: 'hidden',
  
  // Add subtle gradient overlay
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
  
  variants: {
    variant: {
      default: {
        backgroundColor: '$surface',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      },
      
      elevated: {
        backgroundColor: '$surface',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.1)',
        boxShadow: `
          0 0 1px rgba(0, 212, 255, 0.5),
          0 4px 20px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
      },
      
      outlined: {
        backgroundColor: 'rgba(18, 18, 26, 0.5)',
        borderWidth: 2,
        borderColor: 'rgba(0, 212, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: 'linear-gradient(45deg, $neonBlue, $neonPurple, $neonPink, $neonBlue)',
          borderRadius: 12,
          opacity: 0,
          zIndex: -1,
          transition: 'opacity 0.3s',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 10s ease infinite',
        },
      },
    },
    
    interactive: {
      true: {
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        hoverStyle: {
          backgroundColor: '$surfaceHover',
          scale: 1.02,
          borderColor: 'rgba(0, 212, 255, 0.4)',
          
          '&.outlined::after': {
            opacity: 0.1,
          },
        },
        
        pressStyle: {
          scale: 0.98,
        },
        
        focusStyle: {
          borderColor: 'rgba(0, 212, 255, 0.6)',
          outlineWidth: 0,
        },
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'default',
  },
});