import { Sheet, ScrollView, Text, YStack, XStack, Button, Separator } from 'tamagui';
import { X, BellOff, Check } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification.store';
import { NotificationItem } from './NotificationItem';
import { useNotificationApi } from '@/hooks/useNotificationApi';

export function NotificationPanel() {
  const {
    notifications,
    isOpen,
    unreadCount,
    toggleNotificationPanel,
    markAllAsRead,
    clearAll
  } = useNotificationStore();

  const { markAsRead, deleteNotification } = useNotificationApi();

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    // API call would happen here
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAll();
      // API call to delete all notifications would happen here
    }
  };

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={toggleNotificationPanel}
      snapPoints={[85]}
      position={0}
      dismissOnSnapToBottom
      animation="medium"
    >
      <Sheet.Overlay />
      <Sheet.Frame>
        <Sheet.Handle />

        <YStack padding="$4" flex={1}>
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$6" fontWeight="bold">Notifications</Text>
              {unreadCount > 0 && (
                <YStack
                  backgroundColor="$blue10"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text fontSize="$2" color="white" fontWeight="bold">
                    {unreadCount} new
                  </Text>
                </YStack>
              )}
            </XStack>

            <Button
              size="$3"
              circular
              chromeless
              onPress={() => toggleNotificationPanel()}
            >
              <X size={20} />
            </Button>
          </XStack>

          {/* Actions */}
          {notifications.length > 0 && (
            <XStack gap="$2" marginBottom="$3">
              {unreadCount > 0 && (
                <Button
                  size="$2"
                  theme="blue"
                  onPress={handleMarkAllAsRead}
                  icon={Check}
                >
                  Mark all as read
                </Button>
              )}
              <Button
                size="$2"
                theme="red"
                variant="outlined"
                onPress={handleClearAll}
                icon={BellOff}
              >
                Clear all
              </Button>
            </XStack>
          )}

          <Separator marginBottom="$3" />

          {/* Notifications List */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$8">
                <BellOff size={48} color="$gray8" />
                <Text fontSize="$4" color="$gray10" marginTop="$3">
                  No notifications yet
                </Text>
                <Text fontSize="$3" color="$gray9" marginTop="$1">
                  You'll see game invites and updates here
                </Text>
              </YStack>
            ) : (
              <YStack>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onRemove={deleteNotification}
                  />
                ))}
              </YStack>
            )}
          </ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}