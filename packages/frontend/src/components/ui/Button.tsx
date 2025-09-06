import { Button as TamaguiButton, styled } from 'tamagui';
import { forwardRef } from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  size?: '$3' | '$4' | '$5';
  style?: any;
  icon?: React.ReactNode;
}

const StyledButton = styled(TamaguiButton, {
  name: 'Button',
  animation: 'quick',
  
  variants: {
    variant: {
      primary: {
        backgroundColor: '$neonBlue',
        color: '$black',
        borderWidth: 2,
        borderColor: '$neonBlue',
        fontWeight: 'bold',
        
        hoverStyle: {
          backgroundColor: '$neonBlue',
          opacity: 0.9,
          scale: 1.02,
        },
        
        pressStyle: {
          scale: 0.98,
        },
      },
      
      secondary: {
        backgroundColor: 'transparent',
        color: '$neonBlue',
        borderWidth: 2,
        borderColor: '$neonBlue',
        
        hoverStyle: {
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          scale: 1.02,
        },
        
        pressStyle: {
          scale: 0.98,
        },
      },
      
      ghost: {
        backgroundColor: 'transparent',
        color: '$white',
        borderWidth: 0,
        
        hoverStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        
        pressStyle: {
          opacity: 0.8,
        },
      },
      
      danger: {
        backgroundColor: '$error',
        color: '$white',
        borderWidth: 2,
        borderColor: '$error',
        
        hoverStyle: {
          backgroundColor: '$error',
          opacity: 0.9,
          scale: 1.02,
        },
        
        pressStyle: {
          scale: 0.98,
        },
      },
    },
    
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    
    loading: {
      true: {
        opacity: 0.6,
        pointerEvents: 'none',
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'primary',
  },
});

export const Button = forwardRef<any, ButtonProps>((
  { children, loading, variant, fullWidth, onPress, disabled, size, style, icon, ...props }, 
  ref
) => {
  return (
    <StyledButton
      ref={ref}
      variant={variant}
      fullWidth={fullWidth}
      loading={loading}
      onPress={onPress}
      disabled={disabled || loading}
      size={size}
      icon={icon}
      style={{
        boxShadow: variant === 'primary' 
          ? '0 0 20px rgba(0, 255, 255, 0.5)' 
          : undefined,
        ...style,
      }}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </StyledButton>
  );
});

Button.displayName = 'Button';