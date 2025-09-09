import { useState } from 'react';
import { Dialog, YStack, XStack, Text, ScrollView, Checkbox, Label } from 'tamagui';
import { X, Search, UserPlus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNotificationApi } from '@/hooks/useNotificationApi';
import { soundManager } from '@/utils/sound/soundManager';
import type { User } from '@socket-game/shared';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameName: string;
  currentPlayers: string[]; // IDs of players already in game
}

export function InviteModal({ isOpen, onClose, gameId, gameName, currentPlayers }: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const { sendInvitations } = useNotificationApi();
  const [sending, setSending] = useState(false);

  // Fetch online users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'online'],
    queryFn: async () => {
      const response = await api.get('/api/users/online');
      return response.data.users.filter((user: User) => !currentPlayers.includes(user.id));
    },
    enabled: isOpen,
  });

  // Filter users based on search
  const filteredUsers = users.filter((user: User) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u: User) => u.id)));
    }
  };

  const handleSendInvitations = async () => {
    if (selectedUsers.size === 0) return;

    setSending(true);
    try {
      await sendInvitations({
        gameId,
        userIds: Array.from(selectedUsers),
      });

      soundManager.play('invitation');
      onClose();

      // Reset selection
      setSelectedUsers(new Set());
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to send invitations:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key="content"
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          borderRadius="$4"
          backgroundColor="$background"
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
          width="90%"
          maxWidth={500}
          maxHeight="80%"
        >
          <YStack space="$4" padding="$4">
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontSize="$6" fontWeight="bold">Invite Players</Text>
                <Text fontSize="$3" color="$gray10">
                  to "{gameName}"
                </Text>
              </YStack>
              <Button
                size="$3"
                circular
                icon={X}
                onPress={onClose}
              />
            </XStack>

            {/* Search */}
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={<Search size={16} />}
            />

            {/* Select All */}
            {filteredUsers.length > 0 && (
              <XStack space="$2" alignItems="center">
                <Checkbox
                  checked={selectedUsers.size === filteredUsers.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" fontSize="$3">
                  Select all ({filteredUsers.length})
                </Label>
              </XStack>
            )}

            {/* Users List */}
            <ScrollView maxHeight={300}>
              <YStack space="$2">
                {isLoading ? (
                  <Text textAlign="center" color="$gray10">Loading players...</Text>
                ) : filteredUsers.length === 0 ? (
                  <Text textAlign="center" color="$gray10">
                    {searchQuery ? 'No players found' : 'No available players online'}
                  </Text>
                ) : (
                  filteredUsers.map((user: User) => (
                    <XStack
                      key={user.id}
                      padding="$3"
                      borderRadius="$3"
                      backgroundColor={selectedUsers.has(user.id) ? '$blue5' : '$gray3'}
                      hoverStyle={{ backgroundColor: selectedUsers.has(user.id) ? '$blue6' : '$gray4' }}
                      pressStyle={{ scale: 0.98 }}
                      onPress={() => handleSelectUser(user.id)}
                      cursor="pointer"
                      space="$3"
                      alignItems="center"
                    >
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
                      <Text flex={1}>{user.name}</Text>
                    </XStack>
                  ))
                )}
              </YStack>
            </ScrollView>

            {/* Actions */}
            <XStack space="$3" justifyContent="flex-end">
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button
                onPress={handleSendInvitations}
                disabled={selectedUsers.size === 0 || sending}
                loading={sending}
                icon={<UserPlus size={16} />}
              >
                Send {selectedUsers.size > 0 && `(${selectedUsers.size})`}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}