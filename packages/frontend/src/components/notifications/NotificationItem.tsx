import { formatDistanceToNow } from 'date-fns';
import { Gamepad2, Trophy, UserPlus, UserMinus, Info } from 'lucide-react';
import { Card, Text, XStack, YStack, Button } from 'tamagui';
import { useNavigate } from 'react-router-dom';
import type { Notification, NotificationType } from '@socket-game/shared';
import { useNotificationStore } from '@/stores/notification.store';
import { routes } from '@/routes';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function NotificationItem({ notification, onRead, onRemove }: NotificationItemProps) {
  const navigate = useNavigate();
  const { markAsRead, removeNotification } = useNotificationStore();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'game_invitation':
        return Gamepad2;
      case 'game_started':
      case 'game_ended':
        return Trophy;
      case 'player_joined':
        return UserPlus;
      case 'player_left':
        return UserMinus;
      default:
        return Info;
    }
  };

  const handleClick = () => {
    // Mark as read
    if (notification.status !== 'read') {
      markAsRead(notification.id);
      onRead?.(notification.id);
    }

    // Navigate based on notification data
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
    } else if (notification.data?.gameId) {
      // Navigate based on game status
      const gameStatus = notification.data.gameStatus;
      if (gameStatus === 'waiting') {
        navigate(routes.gameRoom.replace(':gameId', notification.data.gameId));
      } else if (gameStatus === 'in_progress') {
        navigate(routes.gameActive.replace(':gameId', notification.data.gameId));
      } else if (gameStatus === 'completed') {
        navigate(routes.gameResults.replace(':gameId', notification.data.gameId));
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notification.id);
    onRemove?.(notification.id);
  };

  const Icon = getIcon(notification.type);
  const isUnread = notification.status !== 'read';

  return (
    <Card
      padding="$3"
      marginBottom="$2"
      backgroundColor={isUnread ? '$backgroundHover' : '$background'}
      hoverStyle={{ backgroundColor: '$backgroundHover' }}
      pressStyle={{ scale: 0.98 }}
      onPress={handleClick}
      cursor="pointer"
      animation="quick"
    >
      <XStack gap="$3" alignItems="center">
        <YStack
          backgroundColor={isUnread ? '$blue5' : '$gray5'}
          padding="$2"
          borderRadius="$4"
        >
          <Icon size={20} color={isUnread ? '$blue10' : '$gray10'} />
        </YStack>

        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight={isUnread ? 'bold' : 'normal'}>
            {notification.title}
          </Text>
          <Text fontSize="$3" color="$gray11">
            {notification.message}
          </Text>
          <Text fontSize="$2" color="$gray10">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </Text>
        </YStack>

        <Button
          size="$2"
          circular
          chromeless
          onPress={handleRemove}
          hoverStyle={{ backgroundColor: '$red5' }}
        >
          <Text>×</Text>
        </Button>
      </XStack>
    </Card>
  );
}