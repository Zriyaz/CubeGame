import { Bell } from 'lucide-react';
import { Button, Text, YStack } from 'tamagui';
import { useNotificationStore } from '@/stores/notification.store';

export function NotificationBell() {
  const { unreadCount, toggleNotificationPanel } = useNotificationStore();

  return (
    <Button
      size="$4"
      circular
      chromeless
      onPress={toggleNotificationPanel}
      position="relative"
      animation="quick"
      hoverStyle={{ scale: 1.1 }}
      pressStyle={{ scale: 0.95 }}
    >
      <Bell size={24} />
      {unreadCount > 0 && (
        <YStack
          position="absolute"
          top={-4}
          right={-4}
          backgroundColor="$red10"
          borderRadius={9999}
          minWidth={18}
          height={18}
          alignItems="center"
          justifyContent="center"
          animation="bouncy"
          enterStyle={{ scale: 0 }}
          exitStyle={{ scale: 0 }}
        >
          <Text color="white" fontSize={10} fontWeight="bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </YStack>
      )}
    </Button>
  );
}