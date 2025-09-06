import { Input as TamaguiInput, styled, Stack, Text } from 'tamagui';
import { forwardRef } from 'react';

export interface InputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  type?: string;
  maxLength?: number;
  disabled?: boolean;
}

const StyledInput = styled(TamaguiInput, {
  name: 'Input',
  backgroundColor: '$surface',
  borderWidth: 2,
  borderColor: '$borderColor',
  color: '$white',
  fontSize: '$base',
  height: 48,
  paddingHorizontal: '$3',
  borderRadius: '$md',
  animation: 'quick',
  
  focusStyle: {
    borderColor: '$neonBlue',
    outlineWidth: 0,
    backgroundColor: '$surfaceHover',
  },
  
  hoverStyle: {
    borderColor: '$borderColorHover',
  },
  
  variants: {
    error: {
      true: {
        borderColor: '$error',
      },
    },
    
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,
});

export const Input = forwardRef<any, InputProps>((
  { label, error, fullWidth, ...props }, 
  ref
) => {
  return (
    <Stack space="$2" width={fullWidth ? '100%' : undefined}>
      {label && (
        <Text fontSize="$sm" color="$textMuted">
          {label}
        </Text>
      )}
      
      <StyledInput
        ref={ref}
        {...props}
        error={!!error}
        fullWidth={fullWidth}
        placeholderTextColor="$textMuted"
      />
      
      {error && (
        <Text fontSize="$xs" color="$error">
          {error}
        </Text>
      )}
    </Stack>
  );
});

Input.displayName = 'Input';