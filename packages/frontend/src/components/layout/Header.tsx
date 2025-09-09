import { XStack, Stack, Text, Avatar, Button, YStack } from 'tamagui';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, LogOut, Zap, Trophy, Coins, Activity, Home, Gamepad2, History, Crown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { SoundToggle } from '@/components/game/GameControls';
import { NotificationBell } from '@/components/notifications';
import { routes } from '@/routes';
import { useEffect, useState } from 'react';
import { soundManager } from '@/utils/sound/soundManager';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function Header({ showBackButton = false, title }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const [time, setTime] = useState(new Date());
  const [playerStats] = useState({
    level: 12,
    xp: 3450,
    coins: 9999,
    winRate: 78,
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNavigation = (route: string) => {
    soundManager.play('cellClick');
    navigate(route);
  };

  const navItems = [
    { route: routes.dashboard, icon: Home, label: 'HOME', color: '#00D4FF' },
    { route: routes.joinGame, icon: Gamepad2, label: 'PLAY', color: '#00FF88' },
    { route: routes.history, icon: History, label: 'HISTORY', color: '#FF0080' },
    { route: routes.leaderboard, icon: Crown, label: 'RANKS', color: '#FFDD00' },
  ];

  const isActive = (route: string) => {
    if (route === routes.joinGame) {
      return location.pathname.includes('/game');
    }
    return location.pathname === route;
  };

  return (
    <Stack
      backgroundColor="rgba(10, 10, 15, 0.95)"
      borderBottomWidth={2}
      borderBottomColor="rgba(0, 212, 255, 0.2)"
      style={{
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        background: 'linear-gradient(180deg, rgba(18, 18, 26, 0.98) 0%, rgba(10, 10, 15, 0.95) 100%)',
      }}
    >
      {/* Top Bar */}
      <XStack
        height={32}
        paddingHorizontal="$5"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="rgba(255, 255, 255, 0.05)"
      >
        {/* Live Status */}
        <XStack alignItems="center" space="$2">
          <Stack
            width={8}
            height={8}
            borderRadius={4}
            backgroundColor="$neonGreen"
            style={{
              boxShadow: '0 0 10px #00FF88',
              animation: 'pulse 2s infinite',
            }}
          />
          <Text fontSize={12} color="$neonGreen" fontWeight="bold">
            LIVE
          </Text>
          <Text fontSize={12} color="$textMuted" marginLeft="$2">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </XStack>

        {/* Player Stats Bar */}
        <XStack alignItems="center" space="$5">
          <XStack alignItems="center" space="$2">
            <Trophy size={14} color="#FFDD00" />
            <Text fontSize={12} color="#FFDD00" fontWeight="bold">
              LEVEL {playerStats.level}
            </Text>
          </XStack>

          <XStack alignItems="center" space="$2">
            <Zap size={14} color="#00D4FF" />
            <Text fontSize={12} color="#00D4FF" fontWeight="bold">
              {playerStats.xp} XP
            </Text>
          </XStack>

          <XStack alignItems="center" space="$2">
            <Coins size={14} color="#FFD700" />
            <Text fontSize={12} color="#FFD700" fontWeight="bold">
              {playerStats.coins.toLocaleString()}
            </Text>
          </XStack>

          <XStack alignItems="center" space="$2">
            <Activity size={14} color="#00FF88" />
            <Text fontSize={12} color="#00FF88" fontWeight="bold">
              {playerStats.winRate}% WIN
            </Text>
          </XStack>
        </XStack>
      </XStack>

      {/* Main Navigation Bar */}
      <XStack
        height={64}
        paddingHorizontal="$5"
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Logo Section */}
        <XStack alignItems="center" space="$4">
          {showBackButton ? (
            <Button
              size="$3"
              onPress={() => navigate(-1)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
              }}
              icon={
                <Text fontSize={20} color="$neonBlue">←</Text>
              }
            />
          ) : (
            <Stack
              onPress={() => handleNavigation(routes.dashboard)}
              cursor="pointer"
              animation="quick"
              hoverStyle={{ scale: 1.05 }}
              pressStyle={{ scale: 0.95 }}
            >
              <YStack alignItems="center" space="$1">
                <Text
                  fontSize={28}
                  fontWeight="900"
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    background: 'linear-gradient(135deg, #00D4FF 0%, #00F0FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
                    letterSpacing: 3,
                  }}
                >
                  NEON GRID
                </Text>
                <Text
                  fontSize={10}
                  color="$neonCyan"
                  opacity={0.8}
                  style={{
                    fontFamily: 'Rajdhani, monospace',
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  CONQUEST
                </Text>
              </YStack>
            </Stack>
          )}

          {title && (
            <Stack
              paddingHorizontal="$3"
              paddingVertical="$1.5"
              borderRadius={20}
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}
            >
              <Text
                fontSize={14}
                fontWeight="bold"
                color="$neonBlue"
                style={{ fontFamily: 'Rajdhani, monospace' }}
              >
                {title}
              </Text>
            </Stack>
          )}
        </XStack>

        {/* Navigation Items */}
        <XStack alignItems="center" space="$2">
          {navItems.map((item) => (
            <Stack
              key={item.route}
              onPress={() => handleNavigation(item.route)}
              cursor="pointer"
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderRadius={8}
              animation="quick"
              hoverStyle={{
                scale: 1.05,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
              pressStyle={{
                scale: 0.95,
              }}
              style={{
                background: isActive(item.route)
                  ? `linear-gradient(135deg, ${item.color}22 0%, ${item.color}11 100%)`
                  : 'transparent',
                borderWidth: 1,
                borderColor: isActive(item.route) ? `${item.color}55` : 'transparent',
                transition: 'all 0.3s ease',
              }}
            >
              <XStack alignItems="center" space="$2">
                <item.icon
                  size={18}
                  color={isActive(item.route) ? item.color : '#B8B8C8'}
                  style={{
                    filter: isActive(item.route) ? `drop-shadow(0 0 10px ${item.color})` : 'none',
                  }}
                />
                <Text
                  fontSize={14}
                  fontWeight="bold"
                  color={isActive(item.route) ? item.color : '$textMuted'}
                  style={{
                    fontFamily: 'Rajdhani, monospace',
                    letterSpacing: 1,
                  }}
                >
                  {item.label}
                </Text>
              </XStack>
            </Stack>
          ))}
        </XStack>

        {/* User Section */}
        <XStack alignItems="center" space="$3">
          <SoundToggle size={20} />

          {user && <NotificationBell />}

          <Stack
            width={1}
            height={30}
            backgroundColor="rgba(255, 255, 255, 0.1)"
          />

          <Button
            size="$3"
            onPress={() => handleNavigation(routes.settings)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
            }}
            hoverStyle={{
              background: 'rgba(0, 212, 255, 0.1)',
              borderColor: 'rgba(0, 212, 255, 0.3)',
            }}
            icon={<Settings size={20} color="#B8B8C8" />}
          />

          {user && (
            <>
              <Stack
                onPress={() => handleNavigation(routes.profile)}
                cursor="pointer"
                animation="quick"
                hoverStyle={{ scale: 1.05 }}
                pressStyle={{ scale: 0.95 }}
              >
                <XStack alignItems="center" space="$3">
                  <Avatar
                    size="$4"
                    circular
                    style={{
                      borderWidth: 2,
                      borderColor: '#00D4FF',
                      boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                    }}
                  >
                    <Avatar.Image src={user.avatar_url} />
                    <Avatar.Fallback
                      backgroundColor="$neonBlue"
                      style={{
                        background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
                      }}
                    >
                      <Text color="$white" fontWeight="900" fontSize={18}>
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </Avatar.Fallback>
                  </Avatar>

                  <YStack space="$0.5">
                    <Text
                      fontSize={14}
                      fontWeight="bold"
                      color="$white"
                      style={{ fontFamily: 'Rajdhani, monospace' }}
                    >
                      {user.name || 'Player'}
                    </Text>
                    <Text fontSize={12} color="$textMuted">
                      #{user.id?.slice(-4) || '0000'}
                    </Text>
                  </YStack>
                </XStack>
              </Stack>

              <Button
                size="$3"
                onPress={handleLogout}
                disabled={logoutMutation.isPending}
                style={{
                  background: 'rgba(255, 0, 128, 0.1)',
                  borderColor: 'rgba(255, 0, 128, 0.3)',
                  borderWidth: 1,
                }}
                hoverStyle={{
                  background: 'rgba(255, 0, 128, 0.2)',
                  borderColor: 'rgba(255, 0, 128, 0.5)',
                }}
                icon={<LogOut size={18} color="#FF0080" />}
                opacity={logoutMutation.isPending ? 0.5 : 1}
              />
            </>
          )}
        </XStack>
      </XStack>

      {/* Bottom Accent Line */}
      <Stack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height={2}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #00D4FF 20%, #FF0080 50%, #00D4FF 80%, transparent 100%)',
          animation: 'gradientShift 8s ease-in-out infinite',
          opacity: 0.6,
        }}
      />
    </Stack>
  );
}