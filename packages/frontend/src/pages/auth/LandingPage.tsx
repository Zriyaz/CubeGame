import { Stack, YStack, XStack, Text, AnimatePresence, Spinner } from 'tamagui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { routes } from '@/routes';
import { useEffect, useState, useRef } from 'react';
import { Zap, Shield, Swords, Trophy, Users, Gamepad2, Star, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '@/utils/sound/soundManager';
import { useAuthStore } from '@/stores/auth.store';
import { useGoogleLogin } from '@/hooks/useAuth';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading, isAuthenticated } = useAuthStore();
  const { login } = useGoogleLogin();
  const [showContent, setShowContent] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [musicPlaying, setMusicPlaying] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  // Handle auth errors from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      console.error('Authentication failed');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      soundManager.stop('backgroundMusic');
      navigate(routes.dashboard);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setShowContent(true);

    // Start playing background music with a slight delay for better UX
    if (soundManager.isEnabled && !isAuthenticated) {
      const musicTimeout = setTimeout(() => {
        soundManager.play('backgroundMusic');
      }, 500);

      // Cleanup: stop music when component unmounts
      return () => {
        clearTimeout(musicTimeout);
        soundManager.stop('backgroundMusic');
      };
    }
  }, [isAuthenticated]);

  const toggleMusic = () => {
    if (musicPlaying) {
      soundManager.stop('backgroundMusic');
      setMusicPlaying(false);
    } else {
      soundManager.play('backgroundMusic');
      setMusicPlaying(true);
    }
  };

  const handleGoogleLogin = () => {
    soundManager.stop('backgroundMusic');
    login();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Stack
      ref={heroRef}
      flex={1}
      backgroundColor="$background"
      position="relative"
      minHeight="100vh"
      width="100%"
      overflow="hidden"
      style={{
        background: '#0A0A0F',
      }}
    >
      {/* Music Toggle Button */}
      <Stack
        position="absolute"
        top={20}
        right={20}
        zIndex={100}
        padding="$3"
        borderRadius={50}
        cursor="pointer"
        onPress={toggleMusic}
        animation="quick"
        hoverStyle={{
          scale: 1.1,
        }}
        pressStyle={{
          scale: 0.9,
        }}
        style={{
          background: 'rgba(18, 18, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(0, 212, 255, 0.3)',
        }}
      >
        <XStack alignItems="center" space="$2">
          {musicPlaying ? (
            <Volume2 size={24} color="#00D4FF" />
          ) : (
            <VolumeX size={24} color="#FF0080" />
          )}
          <Text
            fontSize={14}
            fontWeight="bold"
            color={musicPlaying ? "$neonBlue" : "$neonPink"}
            style={{ fontFamily: 'Rajdhani, monospace' }}
          >
            {musicPlaying ? 'MUSIC ON' : 'MUSIC OFF'}
          </Text>
        </XStack>
      </Stack>

      {/* Dynamic gradient background that follows mouse */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(0, 212, 255, 0.2) 0%, transparent 40%),
            radial-gradient(circle at ${100 - mousePos.x * 100}% ${100 - mousePos.y * 100}%, rgba(255, 0, 128, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.1) 0%, transparent 60%)
          `,
          transition: 'background 0.3s ease',
        }}
      />
      {/* Animated hexagon pattern */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.15}
        pointerEvents="none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300D4FF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          animation: 'backgroundScroll 40s linear infinite',
        }}
      />

      {/* Animated circuit pattern */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        pointerEvents="none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='84' height='48' viewBox='0 0 84 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF0080' fill-opacity='0.3'%3E%3Cpath d='M0 0h12v6H0V0zm28 8h12v6H28V8zm14-8h12v6H42V0zm14 0h12v6H56V0zm0 8h12v6H56V8zM42 8h12v6H42V8zm0 16h12v6H42v-6zm14-8h12v6H56v-6zm14 0h12v6H70v-6zm0-16h12v6H70V0zM28 32h12v6H28v-6zM14 16h12v6H14v-6zM0 24h12v6H0v-6zm0 8h12v6H0v-6zm14 0h12v6H14v-6zm14 8h12v6H28v-6zm-14 0h12v6H14v-6zm28 0h12v6H42v-6zm14-8h12v6H56v-6zm0-8h12v6H56v-6zm14 8h12v6H70v-6zm0 8h12v6H70v-6zM14 24h12v6H14v-6zm14-8h12v6H28v-6zM14 8h12v6H14V8zM0 8h12v6H0V8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          animation: 'backgroundScroll -60s linear infinite',
          transform: 'rotate(45deg) scale(1.5)',
        }}
      />

      {/* Floating game elements */}
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.6}
        pointerEvents="none"
      >
        {/* Floating icons */}
        {[
          { Icon: Gamepad2, color: '#00D4FF', size: 40, duration: 15 },
          { Icon: Trophy, color: '#FFDD00', size: 35, duration: 18 },
          { Icon: Swords, color: '#FF0080', size: 38, duration: 20 },
          { Icon: Shield, color: '#00FF88', size: 36, duration: 17 },
          { Icon: Star, color: '#FF00FF', size: 32, duration: 19 },
          { Icon: Zap, color: '#00FFFF', size: 34, duration: 16 },
        ].map((item, i) => (
          <Stack
            key={i}
            position="absolute"
            left={`${20 + (i * 15)}%`}
            style={{
              animation: `floatIcon ${item.duration}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`,
            }}
          >
            <item.Icon
              size={item.size}
              color={item.color}
              style={{
                filter: `drop-shadow(0 0 20px ${item.color})`,
                opacity: 0.3,
              }}
            />
          </Stack>
        ))}

        {/* Glowing particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              backgroundColor: i % 4 === 0 ? '#00D4FF' : i % 4 === 1 ? '#FF0080' : i % 4 === 2 ? '#00FF88' : '#FFDD00',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 15 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`,
              filter: 'blur(1px)',
            }}
          />
        ))}
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
                {/* Hero Section */}
                <Stack
                  animation="bouncy"
                  enterStyle={{
                    scale: 0,
                    opacity: 0,
                  }}
                  marginBottom="$6"
                >
                  {/* 3D Grid visualization */}
                  <Stack
                    position="relative"
                    width="100%"
                    height={200}
                    marginBottom="$4"
                  >
                    <Stack
                      position="absolute"
                      top="50%"
                      left="50%"
                      width={300}
                      height={150}
                      style={{
                        transform: 'translate(-50%, -50%) perspective(800px) rotateX(45deg)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* 3D Grid */}
                      <Stack
                        position="absolute"
                        width="100%"
                        height="100%"
                        style={{
                          background: `
                          repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 19px,
                            #00D4FF33 19px,
                            #00D4FF33 20px
                          ),
                          repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 19px,
                            #00D4FF33 19px,
                            #00D4FF33 20px
                          )
                        `,
                          boxShadow: '0 0 50px rgba(0, 212, 255, 0.5)',
                          animation: 'gridPulse 3s ease-in-out infinite',
                        }}
                      />

                      {/* Animated cells */}
                      {[...Array(5)].map((_, i) => (
                        <Stack
                          key={i}
                          position="absolute"
                          width={20}
                          height={20}
                          backgroundColor={i % 2 === 0 ? "$neonBlue" : "$neonPink"}
                          style={{
                            left: `${20 + i * 40}px`,
                            top: `${30 + (i % 2) * 40}px`,
                            boxShadow: `0 0 20px ${i % 2 === 0 ? '#00D4FF' : '#FF0080'}`,
                            animation: `cellPulse 2s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>

                  <YStack space="$2" alignItems="center">
                    <Text
                      width="100%"
                      textWrap="nowrap"
                      fontSize={80}
                      fontWeight="900"
                      textAlign="center"
                      style={{
                        fontFamily: 'Orbitron, monospace',
                        background: 'linear-gradient(135deg, #00D4FF 0%, #00F0FF 25%, #FF0080 75%, #FF00FF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 80px rgba(0, 212, 255, 0.8)',
                        letterSpacing: 4,
                        animation: 'glow 3s ease-in-out infinite',
                      }}
                    >
                      NEON GRID
                    </Text>
                    <XStack alignItems="center" space="$3">
                      <Stack
                        width={100}
                        height={2}
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, #00D4FF 50%, transparent 100%)',
                        }}
                      />
                      <Text
                        fontSize={28}
                        fontWeight="700"
                        color="$neonCyan"
                        style={{
                          fontFamily: 'Rajdhani, monospace',
                          letterSpacing: 8,
                          textTransform: 'uppercase',
                        }}
                      >
                        CONQUEST
                      </Text>
                      <Stack
                        width={100}
                        height={2}
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, #FF0080 50%, transparent 100%)',
                        }}
                      />
                    </XStack>
                  </YStack>
                </Stack>

                {/* Tagline with glitch effect */}
                <Stack
                  animation="quick"
                  enterStyle={{
                    opacity: 0,
                    y: 20,
                  }}
                  position="relative"
                  marginBottom="$8"
                >
                  <Text
                    fontSize={24}
                    textAlign="center"
                    color="$white"
                    style={{
                      fontFamily: 'Rajdhani, monospace',
                      fontWeight: '600',
                      letterSpacing: 2,
                      position: 'relative',
                    }}
                  >
                    REAL-TIME MULTIPLAYER STRATEGY
                  </Text>
                  <Text
                    fontSize={20}
                    textAlign="center"
                    color="$neonCyan"
                    marginTop="$2"
                    opacity={0.8}
                    style={{
                      fontFamily: 'Rajdhani, monospace',
                      animation: 'glitch 5s infinite',
                    }}
                  >
                    Claim the grid • Dominate the battlefield • Own the game
                  </Text>
                </Stack>

                {/* CTA Buttons */}
                <Stack
                  width="100%"
                  maxWidth={400}
                  animation="quick"
                  enterStyle={{
                    opacity: 0,
                    y: 20,
                  }}
                  space="$4"
                >
                  <Button
                    size="$6"
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                    fullWidth
                    style={{
                      fontSize: 20,
                      paddingVertical: 24,
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
                      boxShadow: '0 8px 32px rgba(0, 255, 136, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: 2,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isLoading ? (
                      <XStack alignItems="center" justifyContent="center" space="$3">
                        <Spinner size="small" color="$white" />
                        <Text>SIGNING IN...</Text>
                      </XStack>
                    ) : (
                      <XStack alignItems="center" justifyContent="center" space="$3">
                        <Zap size={24} />
                        <Text>PLAY NOW</Text>
                      </XStack>
                    )}
                  </Button>
                </Stack>

                {/* Features Grid */}
                <Stack
                  animation="lazy"
                  enterStyle={{
                    opacity: 0,
                  }}
                  width="100%"
                  maxWidth={800}
                  marginTop="$8"
                >
                  <XStack flexWrap="wrap" justifyContent="center" gap="$4">
                    <FeatureCard
                      icon={Gamepad2}
                      title="Real-Time Battle"
                      description="Instant multiplayer action"
                      color="#00D4FF"
                    />
                    <FeatureCard
                      icon={Users}
                      title="Global Arena"
                      description="Challenge players worldwide"
                      color="#FF0080"
                    />
                    <FeatureCard
                      icon={Trophy}
                      title="Competitive"
                      description="Climb the leaderboards"
                      color="#FFDD00"
                    />
                    <FeatureCard
                      icon={Sparkles}
                      title="Strategic"
                      description="Master the grid tactics"
                      color="#00FF88"
                    />
                  </XStack>

                  {/* Stats */}
                  <XStack
                    justifyContent="center"
                    space="$8"
                    marginTop="$8"
                    opacity={0.8}
                  >
                    <YStack alignItems="center">
                      <Text
                        fontSize={32}
                        fontWeight="900"
                        color="$neonBlue"
                        style={{ fontFamily: 'Orbitron, monospace' }}
                      >
                        10K+
                      </Text>
                      <Text fontSize={14} color="$textMuted">Active Players</Text>
                    </YStack>
                    <YStack alignItems="center">
                      <Text
                        fontSize={32}
                        fontWeight="900"
                        color="$neonPink"
                        style={{ fontFamily: 'Orbitron, monospace' }}
                      >
                        50K+
                      </Text>
                      <Text fontSize={14} color="$textMuted">Games Played</Text>
                    </YStack>
                    <YStack alignItems="center">
                      <Text
                        fontSize={32}
                        fontWeight="900"
                        color="$neonGreen"
                        style={{ fontFamily: 'Orbitron, monospace' }}
                      >
                        4.8★
                      </Text>
                      <Text fontSize={14} color="$textMuted">Player Rating</Text>
                    </YStack>
                  </XStack>
                </Stack>
              </>
            )}
          </AnimatePresence>
        </YStack>
      </Stack>
    </Stack>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Stack
      padding="$4"
      borderRadius={12}
      minWidth={180}
      maxWidth={220}
      alignItems="center"
      space="$3"
      hoverStyle={{
        scale: 1.05,
        y: -5,
      }}
      pressStyle={{
        scale: 0.95,
      }}
      animation="quick"
      style={{
        background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        borderColor: `${color}33`,
        borderWidth: 1,
        transition: 'all 0.3s ease',
      }}
      onHoverIn={() => {
        // Optional: Add hover sound effect
      }}
    >
      <Stack
        padding="$2.5"
        borderRadius={10}
        style={{
          background: `${color}22`,
          boxShadow: `0 0 30px ${color}55`,
        }}
      >
        <Icon size={32} color={color} strokeWidth={2} />
      </Stack>

      <YStack alignItems="center" space="$1">
        <Text
          fontSize={18}
          fontWeight="bold"
          color="$white"
          style={{ fontFamily: 'Rajdhani, monospace' }}
        >
          {title}
        </Text>
        <Text
          fontSize={14}
          color="$textMuted"
          textAlign="center"
          opacity={0.7}
        >
          {description}
        </Text>
      </YStack>
    </Stack>
  );
}