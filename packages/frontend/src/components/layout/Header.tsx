import { XStack, Stack, Text, Avatar, Button } from 'tamagui';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { SoundToggle } from '@/components/game/GameControls';
import { routes } from '@/routes';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function Header({ showBackButton = false, title }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <XStack
      backgroundColor="$surface"
      height={64}
      paddingHorizontal="$4"
      alignItems="center"
      justifyContent="space-between"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      {/* Left Section */}
      <XStack alignItems="center" space="$4">
        {showBackButton ? (
          <Button
            size="$3"
            variant="ghost"
            onPress={() => navigate(-1)}
            icon={
              <Text fontSize={24}>←</Text>
            }
          />
        ) : (
          <Stack
            onPress={() => navigate(routes.dashboard)}
            cursor="pointer"
            animation="quick"
            hoverStyle={{ scale: 1.05 }}
          >
            <Text
              fontSize="$xl"
              fontWeight="bold"
              color="$neonBlue"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              NEON GRID
            </Text>
          </Stack>
        )}
        
        {title && (
          <Text fontSize="$lg" fontWeight="medium">
            {title}
          </Text>
        )}
      </XStack>

      {/* Right Section */}
      <XStack alignItems="center" space="$3">
        <SoundToggle size={20} />
        
        <Button
          size="$3"
          variant="ghost"
          circular
          onPress={() => navigate(routes.settings)}
          icon={<Settings size={20} />}
        />
        
        {user && (
          <>
            <Avatar
              size="$4"
              circular
              cursor="pointer"
              onPress={() => navigate(routes.profile)}
            >
              <Avatar.Image src={user.avatarUrl} />
              <Avatar.Fallback backgroundColor="$neonBlue">
                <Text color="$black" fontWeight="bold">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </Avatar.Fallback>
            </Avatar>
            
            <Button
              size="$3"
              variant="ghost"
              circular
              onPress={handleLogout}
              disabled={logoutMutation.isPending}
              icon={<LogOut size={20} />}
              opacity={logoutMutation.isPending ? 0.5 : 1}
            />
          </>
        )}
      </XStack>
    </XStack>
  );
}