import { Stack, YStack, XStack, Text, AnimatePresence } from 'tamagui';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { routes } from '@/routes';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  return (
    <Stack 
      flex={1} 
      backgroundColor="$background" 
      position="relative"
      minHeight="100vh"
      width="100%"
    >
      {/* Background Animation */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        pointerEvents="none"
      >
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 50%, #00FFFF 0%, transparent 50%)',
          animation: 'float 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 80% 50%, #FF00FF 0%, transparent 50%)',
          animation: 'float 10s ease-in-out infinite reverse',
        }} />
      </Stack>

      {/* Main Content Container */}
      <Stack 
        flex={1} 
        width="100%" 
        alignItems="center" 
        justifyContent="center"
      >
        <YStack
          padding="$6"
          space="$8"
          maxWidth={600}
          width="100%"
          alignItems="center"
        >
        <AnimatePresence>
          {showContent && (
            <>
              {/* Logo */}
              <Stack
                animation="bouncy"
                enterStyle={{
                  scale: 0,
                  opacity: 0,
                  rotate: '-180deg',
                }}
              >
                <Text
                  fontSize={64}
                  fontWeight="900"
                  textAlign="center"
                  color="$neonBlue"
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    textShadow: '0 0 40px rgba(0, 255, 255, 0.8)',
                  }}
                >
                  NEON GRID
                </Text>
                <Text
                  fontSize={72}
                  fontWeight="900"
                  textAlign="center"
                  color="$neonPink"
                  marginTop={-20}
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    textShadow: '0 0 40px rgba(255, 0, 255, 0.8)',
                  }}
                >
                  CONQUEST
                </Text>
              </Stack>

              {/* Tagline */}
              <Stack
                animation="quick"
                enterStyle={{
                  opacity: 0,
                  y: 20,
                }}
              >
                <Text
                  fontSize="$xl"
                  textAlign="center"
                  color="$white"
                  opacity={0.9}
                >
                  Real-time multiplayer strategy
                </Text>
                <Text
                  fontSize="$lg"
                  textAlign="center"
                  color="$textMuted"
                  marginTop="$2"
                >
                  Claim the grid. Own the game.
                </Text>
              </Stack>

              {/* Login Button */}
              <Stack
                width="100%"
                maxWidth={300}
                animation="quick"
                enterStyle={{
                  opacity: 0,
                  y: 20,
                }}
              >
                <Button
                  size="$5"
                  onPress={() => navigate(routes.login)}
                  fullWidth
                  style={{
                    fontSize: 18,
                    paddingVertical: 16,
                  }}
                >
                  Sign in with Google
                </Button>
              </Stack>

              {/* Features */}
              <Stack
                animation="lazy"
                enterStyle={{
                  opacity: 0,
                }}
              >
                <YStack space="$3" alignItems="center">
                  <FeatureItem icon="🎮" text="Real-time multiplayer action" />
                  <FeatureItem icon="🌍" text="Compete with friends worldwide" />
                  <FeatureItem icon="🎯" text="Strategic grid-based gameplay" />
                  <FeatureItem icon="🏆" text="Leaderboards and achievements" />
                </YStack>
              </Stack>
            </>
          )}
        </AnimatePresence>
        </YStack>
      </Stack>
    </Stack>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <XStack space="$3" alignItems="center">
      <Text fontSize={24}>{icon}</Text>
      <Text fontSize="$base" color="$textMuted">
        {text}
      </Text>
    </XStack>
  );
}