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
  borderRadius: '$lg',
  padding: '$4',
  animation: 'lazy',
  
  variants: {
    variant: {
      default: {
        backgroundColor: '$surface',
      },
      
      elevated: {
        backgroundColor: '$surface',
        elevation: '$2',
        shadowColor: '$neonBlue',
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
      },
    },
    
    interactive: {
      true: {
        cursor: 'pointer',
        
        hoverStyle: {
          backgroundColor: '$surfaceHover',
          scale: 1.02,
          borderColor: '$neonBlue',
        },
        
        pressStyle: {
          scale: 0.98,
        },
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'default',
  },
});