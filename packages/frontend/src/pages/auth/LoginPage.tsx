import { YStack, XStack, Text, Stack, Spinner } from 'tamagui';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth.store';
import { useGoogleLogin } from '@/hooks/useAuth';
import { routes } from '@/routes';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading, isAuthenticated } = useAuthStore();
  const { login } = useGoogleLogin();

  // Handle auth errors from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      // TODO: Show toast notification
      console.error('Authentication failed');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.dashboard);
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    login();
  };

  return (
    <Stack 
      flex={1} 
      backgroundColor="$background" 
      minHeight="100vh"
      width="100%"
      alignItems="center" 
      justifyContent="center"
    >
      <YStack space="$6" maxWidth={400} width="100%" alignItems="center" padding="$6">
        <YStack space="$2" alignItems="center">
          <Text fontSize={48} fontWeight="900" color="$neonBlue" style={{ fontFamily: 'Orbitron, monospace' }}>
            NEON GRID
          </Text>
          <Text fontSize="$lg" color="$textMuted">
            Sign in to continue
          </Text>
        </YStack>

        <Button
          size="$5"
          onPress={handleGoogleLogin}
          fullWidth
          disabled={isLoading}
          style={{ paddingVertical: 16 }}
        >
          {isLoading ? (
            <XStack space="$2" alignItems="center">
              <Spinner size="small" color="$white" />
              <Text>Signing in...</Text>
            </XStack>
          ) : (
            '🔐 Sign in with Google'
          )}
        </Button>

        <Text fontSize="$sm" color="$textMuted" textAlign="center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </YStack>
    </Stack>
  );
}