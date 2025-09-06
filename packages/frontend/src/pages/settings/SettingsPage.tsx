import { useState } from 'react';
import { YStack, XStack, Stack, Text, ScrollView, Switch, Slider } from 'tamagui';
import { Volume2, Bell, Eye, Gamepad2, Palette, Shield, LogOut } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { soundManager } from '@/utils/sound/soundManager';
import { useNavigate } from 'react-router-dom';

interface Settings {
  sound: {
    enabled: boolean;
    masterVolume: number;
    effectsVolume: number;
    musicVolume: number;
  };
  notifications: {
    gameInvites: boolean;
    turnReminders: boolean;
    achievements: boolean;
    friendRequests: boolean;
  };
  gameplay: {
    showAnimations: boolean;
    autoEndTurn: boolean;
    confirmMoves: boolean;
    showTimer: boolean;
    colorBlindMode: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowSpectators: boolean;
    shareStatistics: boolean;
  };
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<Settings>({
    sound: {
      enabled: soundManager.enabled,
      masterVolume: 80,
      effectsVolume: 100,
      musicVolume: 60,
    },
    notifications: {
      gameInvites: true,
      turnReminders: true,
      achievements: true,
      friendRequests: true,
    },
    gameplay: {
      showAnimations: true,
      autoEndTurn: false,
      confirmMoves: false,
      showTimer: true,
      colorBlindMode: false,
    },
    privacy: {
      showOnlineStatus: true,
      allowSpectators: true,
      shareStatistics: false,
    },
  });

  const handleSaveSettings = () => {
    // TODO: Save settings to backend
    setHasChanges(false);
    soundManager.toggle(settings.sound.enabled);
    soundManager.play('cellClick');
  };

  const handleResetSettings = () => {
    // TODO: Reset to default settings
    setHasChanges(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const updateSetting = <K extends keyof Settings>(
    category: K,
    field: keyof Settings[K],
    value: any
  ) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value,
      },
    });
    setHasChanges(true);
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" space="$4" maxWidth={800} margin="0 auto" width="100%">
        <YStack space="$2">
          <Text fontSize="$2xl" fontWeight="bold">Settings</Text>
          <Text color="$textMuted">Customize your gaming experience</Text>
        </YStack>

        {/* Sound Settings */}
        <Card variant="elevated" padding="$4" space="$4">
          <XStack space="$2" alignItems="center">
            <Volume2 size={24} color="$neonBlue" />
            <Text fontSize="$lg" fontWeight="bold">Sound</Text>
          </XStack>

          <YStack space="$4">
            <SettingRow
              label="Enable Sound"
              description="Toggle all game sounds on/off"
            >
              <Switch
                checked={settings.sound.enabled}
                onCheckedChange={(checked) => updateSetting('sound', 'enabled', checked)}
              />
            </SettingRow>

            <YStack space="$2" opacity={settings.sound.enabled ? 1 : 0.5}>
              <VolumeSlider
                label="Master Volume"
                value={settings.sound.masterVolume}
                onChange={(value) => updateSetting('sound', 'masterVolume', value)}
                disabled={!settings.sound.enabled}
              />
              
              <VolumeSlider
                label="Effects Volume"
                value={settings.sound.effectsVolume}
                onChange={(value) => updateSetting('sound', 'effectsVolume', value)}
                disabled={!settings.sound.enabled}
              />
              
              <VolumeSlider
                label="Music Volume"
                value={settings.sound.musicVolume}
                onChange={(value) => updateSetting('sound', 'musicVolume', value)}
                disabled={!settings.sound.enabled}
              />
            </YStack>
          </YStack>
        </Card>

        {/* Notification Settings */}
        <Card variant="elevated" padding="$4" space="$4">
          <XStack space="$2" alignItems="center">
            <Bell size={24} color="$neonGreen" />
            <Text fontSize="$lg" fontWeight="bold">Notifications</Text>
          </XStack>

          <YStack space="$3">
            <SettingRow
              label="Game Invites"
              description="Get notified when invited to games"
            >
              <Switch
                checked={settings.notifications.gameInvites}
                onCheckedChange={(checked) => updateSetting('notifications', 'gameInvites', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Turn Reminders"
              description="Remind when it's your turn"
            >
              <Switch
                checked={settings.notifications.turnReminders}
                onCheckedChange={(checked) => updateSetting('notifications', 'turnReminders', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Achievements"
              description="Celebrate your victories"
            >
              <Switch
                checked={settings.notifications.achievements}
                onCheckedChange={(checked) => updateSetting('notifications', 'achievements', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Friend Requests"
              description="Know when players want to connect"
            >
              <Switch
                checked={settings.notifications.friendRequests}
                onCheckedChange={(checked) => updateSetting('notifications', 'friendRequests', checked)}
              />
            </SettingRow>
          </YStack>
        </Card>

        {/* Gameplay Settings */}
        <Card variant="elevated" padding="$4" space="$4">
          <XStack space="$2" alignItems="center">
            <Gamepad2 size={24} color="$neonPink" />
            <Text fontSize="$lg" fontWeight="bold">Gameplay</Text>
          </XStack>

          <YStack space="$3">
            <SettingRow
              label="Show Animations"
              description="Enable visual effects and transitions"
            >
              <Switch
                checked={settings.gameplay.showAnimations}
                onCheckedChange={(checked) => updateSetting('gameplay', 'showAnimations', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Auto End Turn"
              description="Automatically end turn after move"
            >
              <Switch
                checked={settings.gameplay.autoEndTurn}
                onCheckedChange={(checked) => updateSetting('gameplay', 'autoEndTurn', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Confirm Moves"
              description="Ask before making moves"
            >
              <Switch
                checked={settings.gameplay.confirmMoves}
                onCheckedChange={(checked) => updateSetting('gameplay', 'confirmMoves', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Show Timer"
              description="Display game timer"
            >
              <Switch
                checked={settings.gameplay.showTimer}
                onCheckedChange={(checked) => updateSetting('gameplay', 'showTimer', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Color Blind Mode"
              description="Use patterns instead of colors"
            >
              <Switch
                checked={settings.gameplay.colorBlindMode}
                onCheckedChange={(checked) => updateSetting('gameplay', 'colorBlindMode', checked)}
              />
            </SettingRow>
          </YStack>
        </Card>

        {/* Privacy Settings */}
        <Card variant="elevated" padding="$4" space="$4">
          <XStack space="$2" alignItems="center">
            <Shield size={24} color="$neonYellow" />
            <Text fontSize="$lg" fontWeight="bold">Privacy</Text>
          </XStack>

          <YStack space="$3">
            <SettingRow
              label="Show Online Status"
              description="Let others see when you're online"
            >
              <Switch
                checked={settings.privacy.showOnlineStatus}
                onCheckedChange={(checked) => updateSetting('privacy', 'showOnlineStatus', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Allow Spectators"
              description="Let others watch your games"
            >
              <Switch
                checked={settings.privacy.allowSpectators}
                onCheckedChange={(checked) => updateSetting('privacy', 'allowSpectators', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Share Statistics"
              description="Show your stats on leaderboards"
            >
              <Switch
                checked={settings.privacy.shareStatistics}
                onCheckedChange={(checked) => updateSetting('privacy', 'shareStatistics', checked)}
              />
            </SettingRow>
          </YStack>
        </Card>

        {/* Theme Settings */}
        <Card variant="elevated" padding="$4" space="$4">
          <XStack space="$2" alignItems="center">
            <Palette size={24} color="$neonOrange" />
            <Text fontSize="$lg" fontWeight="bold">Appearance</Text>
          </XStack>

          <YStack space="$3">
            <Text fontSize="$sm" color="$textMuted">Choose your preferred color theme</Text>
            <XStack space="$2" flexWrap="wrap">
              {['#00FFCC', '#FF0044', '#0099FF', '#FFBB00', '#BB00FF', '#00FF44'].map((color) => (
                <Button
                  key={color}
                  size="$3"
                  circular
                  backgroundColor={color}
                  borderWidth={2}
                  borderColor={user?.preferredColor === color ? '$white' : 'transparent'}
                  onPress={() => {/* TODO: Update theme */}}
                />
              ))}
            </XStack>
          </YStack>
        </Card>

        {/* Account Actions */}
        <YStack space="$3">
          <XStack space="$3">
            <Button
              flex={1}
              size="$4"
              onPress={handleSaveSettings}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
            
            <Button
              flex={1}
              size="$4"
              variant="ghost"
              onPress={handleResetSettings}
              disabled={!hasChanges}
            >
              Reset to Defaults
            </Button>
          </XStack>

          <Button
            size="$4"
            variant="danger"
            fullWidth
            icon={<LogOut size={20} />}
            onPress={handleLogout}
          >
            Sign Out
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

function SettingRow({ 
  label, 
  description, 
  children 
}: { 
  label: string; 
  description?: string; 
  children: React.ReactNode;
}) {
  return (
    <XStack justifyContent="space-between" alignItems="center" space="$4">
      <YStack flex={1} space="$1">
        <Text fontWeight="bold">{label}</Text>
        {description && (
          <Text fontSize="$sm" color="$textMuted">{description}</Text>
        )}
      </YStack>
      {children}
    </XStack>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <YStack space="$2" opacity={disabled ? 0.5 : 1}>
      <XStack justifyContent="space-between">
        <Text fontSize="$sm">{label}</Text>
        <Text fontSize="$sm" color="$neonBlue">{value}%</Text>
      </XStack>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={100}
        step={5}
        disabled={disabled}
      >
        <Slider.Track backgroundColor="$surface" height={8}>
          <Slider.TrackActive backgroundColor="$neonBlue" />
        </Slider.Track>
        <Slider.Thumb
          size="$1"
          circular
          backgroundColor="$neonBlue"
          borderWidth={2}
          borderColor="$borderColor"
        />
      </Slider>
    </YStack>
  );
}