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
  fontFamily: '$heading',
  textTransform: 'uppercase',
  letterSpacing: 1.5,
  borderRadius: 8,
  position: 'relative',
  overflow: 'hidden',
  
  // Add pseudo-element for glow effect
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: -100,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s',
  },
  
  '&:hover::before': {
    left: '100%',
  },
  
  variants: {
    variant: {
      primary: {
        backgroundColor: '$neonBlue',
        color: '#000',
        borderWidth: 2,
        borderColor: '$neonBlue',
        fontWeight: 'bold',
        boxShadow: '0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 20px rgba(0, 212, 255, 0.1)',
        
        hoverStyle: {
          backgroundColor: '$neonCyan',
          borderColor: '$neonCyan',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.7), inset 0 0 20px rgba(0, 240, 255, 0.2)',
          scale: 1.02,
        },
        
        pressStyle: {
          scale: 0.98,
          boxShadow: '0 0 10px rgba(0, 212, 255, 0.3), inset 0 0 10px rgba(0, 212, 255, 0.1)',
        },
      },
      
      secondary: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        color: '$neonBlue',
        borderWidth: 2,
        borderColor: 'rgba(0, 212, 255, 0.5)',
        backdropFilter: 'blur(10px)',
        
        hoverStyle: {
          backgroundColor: 'rgba(0, 212, 255, 0.2)',
          borderColor: '$neonBlue',
          scale: 1.02,
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
        },
        
        pressStyle: {
          scale: 0.98,
        },
      },
      
      ghost: {
        backgroundColor: 'transparent',
        color: '$textSecondary',
        borderWidth: 0,
        
        hoverStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: '$textPrimary',
        },
        
        pressStyle: {
          opacity: 0.8,
        },
      },
      
      danger: {
        backgroundColor: 'rgba(255, 51, 102, 0.1)',
        color: '$neonRed',
        borderWidth: 2,
        borderColor: 'rgba(255, 51, 102, 0.5)',
        
        hoverStyle: {
          backgroundColor: 'rgba(255, 51, 102, 0.2)',
          borderColor: '$neonRed',
          scale: 1.02,
          boxShadow: '0 0 20px rgba(255, 51, 102, 0.5)',
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