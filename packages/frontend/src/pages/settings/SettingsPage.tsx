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
    <Stack flex={1} backgroundColor="$background">
      <ScrollView 
        flex={1}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <Stack flex={1} alignItems="center" width="100%">
          <YStack padding="$5" space="$5" width="100%" maxWidth={1000}>
        <YStack space="$3" marginBottom="$2">
          <Text 
            fontSize={40} 
            fontWeight="900"
            style={{
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(135deg, #00D4FF 0%, #00F0FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0, 212, 255, 0.5)',
            }}
          >
            SETTINGS
          </Text>
          <Text color="$textMuted" fontSize={18} opacity={0.8}>
            Customize your gaming experience
          </Text>
        </YStack>

        {/* Sound Settings */}
        <Card 
          padding="$5" 
          space="$4"
          style={{
            background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(0, 212, 255, 0.2)',
            borderWidth: 1,
          }}
        >
          <XStack space="$3" alignItems="center" marginBottom="$3">
            <Stack
              padding="$2"
              borderRadius={10}
              style={{
                background: 'rgba(0, 212, 255, 0.2)',
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
              }}
            >
              <Volume2 size={24} color="#00D4FF" />
            </Stack>
            <Text fontSize={22} fontWeight="bold" style={{ fontFamily: 'Rajdhani, monospace' }}>SOUND</Text>
          </XStack>

          <YStack space="$4">
            <SettingRow
              label="Enable Sound"
              description="Toggle all game sounds on/off"
            >
              <GameSwitch
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
        <Card 
          padding="$5" 
          space="$4"
          style={{
            background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(0, 255, 136, 0.2)',
            borderWidth: 1,
          }}
        >
          <XStack space="$3" alignItems="center" marginBottom="$3">
            <Stack
              padding="$2"
              borderRadius={10}
              style={{
                background: 'rgba(0, 255, 136, 0.2)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
              }}
            >
              <Bell size={24} color="#00FF88" />
            </Stack>
            <Text fontSize={22} fontWeight="bold" style={{ fontFamily: 'Rajdhani, monospace' }}>NOTIFICATIONS</Text>
          </XStack>

          <YStack space="$3">
            <SettingRow
              label="Game Invites"
              description="Get notified when invited to games"
            >
              <GameSwitch
                checked={settings.notifications.gameInvites}
                onCheckedChange={(checked) => updateSetting('notifications', 'gameInvites', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Turn Reminders"
              description="Remind when it's your turn"
            >
              <GameSwitch
                checked={settings.notifications.turnReminders}
                onCheckedChange={(checked) => updateSetting('notifications', 'turnReminders', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Achievements"
              description="Celebrate your victories"
            >
              <GameSwitch
                checked={settings.notifications.achievements}
                onCheckedChange={(checked) => updateSetting('notifications', 'achievements', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Friend Requests"
              description="Know when players want to connect"
            >
              <GameSwitch
                checked={settings.notifications.friendRequests}
                onCheckedChange={(checked) => updateSetting('notifications', 'friendRequests', checked)}
              />
            </SettingRow>
          </YStack>
        </Card>

        {/* Gameplay Settings */}
        <Card 
          padding="$5" 
          space="$4"
          style={{
            background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 0, 128, 0.2)',
            borderWidth: 1,
          }}
        >
          <XStack space="$3" alignItems="center" marginBottom="$3">
            <Stack
              padding="$2"
              borderRadius={10}
              style={{
                background: 'rgba(255, 0, 128, 0.2)',
                boxShadow: '0 0 20px rgba(255, 0, 128, 0.3)',
              }}
            >
              <Gamepad2 size={24} color="#FF0080" />
            </Stack>
            <Text fontSize={22} fontWeight="bold" style={{ fontFamily: 'Rajdhani, monospace' }}>GAMEPLAY</Text>
          </XStack>

          <YStack space="$3">
            <SettingRow
              label="Show Animations"
              description="Enable visual effects and transitions"
            >
              <GameSwitch
                checked={settings.gameplay.showAnimations}
                onCheckedChange={(checked) => updateSetting('gameplay', 'showAnimations', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Auto End Turn"
              description="Automatically end turn after move"
            >
              <GameSwitch
                checked={settings.gameplay.autoEndTurn}
                onCheckedChange={(checked) => updateSetting('gameplay', 'autoEndTurn', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Confirm Moves"
              description="Ask before making moves"
            >
              <GameSwitch
                checked={settings.gameplay.confirmMoves}
                onCheckedChange={(checked) => updateSetting('gameplay', 'confirmMoves', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Show Timer"
              description="Display game timer"
            >
              <GameSwitch
                checked={settings.gameplay.showTimer}
                onCheckedChange={(checked) => updateSetting('gameplay', 'showTimer', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Color Blind Mode"
              description="Use patterns instead of colors"
            >
              <GameSwitch
                checked={settings.gameplay.colorBlindMode}
                onCheckedChange={(checked) => updateSetting('gameplay', 'colorBlindMode', checked)}
              />
            </SettingRow>
          </YStack>
        </Card>

        {/* Privacy Settings */}
        <Card 
          padding="$5" 
          space="$4"
          style={{
            background: 'linear-gradient(135deg, rgba(18, 18, 26, 0.95) 0%, rgba(10, 10, 15, 0.95) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 221, 0, 0.2)',
            borderWidth: 1,
          }}
        >
          <XStack space="$3" alignItems="center" marginBottom="$3">
            <Stack
              padding="$2"
              borderRadius={10}
              style={{
                background: 'rgba(255, 221, 0, 0.2)',
                boxShadow: '0 0 20px rgba(255, 221, 0, 0.3)',
              }}
            >
              <Shield size={24} color="#FFDD00" />
            </Stack>
            <Text fontSize={22} fontWeight="bold" style={{ fontFamily: 'Rajdhani, monospace' }}>PRIVACY</Text>
          </XStack>

          <YStack space="$3">
            <SettingRow
              label="Show Online Status"
              description="Let others see when you're online"
            >
              <GameSwitch
                checked={settings.privacy.showOnlineStatus}
                onCheckedChange={(checked) => updateSetting('privacy', 'showOnlineStatus', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Allow Spectators"
              description="Let others watch your games"
            >
              <GameSwitch
                checked={settings.privacy.allowSpectators}
                onCheckedChange={(checked) => updateSetting('privacy', 'allowSpectators', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Share Statistics"
              description="Show your stats on leaderboards"
            >
              <GameSwitch
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
        <YStack space="$5" marginTop="$4">
          {hasChanges && (
            <Stack
              padding="$4"
              borderRadius={12}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%)',
                border: '1px solid rgba(0, 255, 136, 0.4)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
              }}
            >
              <Text 
                fontSize={16} 
                color="$neonGreen" 
                textAlign="center" 
                fontWeight="bold"
              >
                ✓ Settings saved automatically
              </Text>
            </Stack>
          )}
          
          <XStack space="$4" alignItems="center" flexWrap="wrap">
            <Stack flex={1} minWidth={200}>
              <Button
                size="$5"
                onPress={handleSaveSettings}
                disabled={!hasChanges}
                fullWidth
                style={{
                  paddingVertical: 16,
                  fontSize: 16,
                  fontWeight: 'bold',
                  background: !hasChanges 
                    ? 'linear-gradient(135deg, #333333 0%, #222222 100%)'
                    : 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
                  boxShadow: hasChanges 
                    ? '0 4px 20px rgba(0, 255, 136, 0.4)'
                    : 'none',
                }}
              >
                Save Changes
              </Button>
            </Stack>
            
            <Stack flex={1} minWidth={200}>
              <Button
                size="$5"
                variant="secondary"
                onPress={handleResetSettings}
                disabled={!hasChanges}
                fullWidth
                style={{
                  paddingVertical: 16,
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                Reset to Defaults
              </Button>
            </Stack>
          </XStack>

          <Stack
            padding="$5"
            borderRadius={12}
            marginTop="$4"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 0, 128, 0.05) 100%)',
              border: '1px solid rgba(255, 0, 128, 0.3)',
            }}
          >
            <Text 
              fontSize={18} 
              fontWeight="bold" 
              marginBottom="$3"
              color="$neonPink"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              DANGER ZONE
            </Text>
            <Button
              size="$5"
              fullWidth
              icon={<LogOut size={22} />}
              onPress={handleLogout}
              style={{
                paddingVertical: 16,
                fontSize: 16,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #FF0080 0%, #CC0066 100%)',
                boxShadow: '0 4px 20px rgba(255, 0, 128, 0.4)',
              }}
            >
              SIGN OUT
            </Button>
          </Stack>
        </YStack>
          </YStack>
        </Stack>
      </ScrollView>
    </Stack>
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
    <Stack
      paddingVertical="$3"
      paddingHorizontal="$4"
      borderRadius={12}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <XStack justifyContent="space-between" alignItems="center" space="$4">
        <YStack flex={1} space="$1.5">
          <Text fontWeight="bold" fontSize={16}>{label}</Text>
          {description && (
            <Text fontSize={14} color="$textMuted" opacity={0.7}>{description}</Text>
          )}
        </YStack>
        {children}
      </XStack>
    </Stack>
  );
}

// Custom styled switch for gaming theme
function GameSwitch({ 
  checked, 
  onCheckedChange 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
}) {
  const handleToggle = () => {
    const newValue = !checked;
    
    // Play different sounds for on/off
    if (newValue) {
      soundManager.play('powerUp');
    } else {
      soundManager.play('powerDown');
    }
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onCheckedChange(newValue);
  };

  return (
    <Stack
      width={56}
      height={32}
      borderRadius={16}
      padding={2}
      cursor="pointer"
      onPress={handleToggle}
      animation="quick"
      hoverStyle={{
        scale: 1.05,
      }}
      pressStyle={{
        scale: 0.95,
      }}
      style={{
        background: checked 
          ? 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)' 
          : 'rgba(255, 255, 255, 0.1)',
        border: checked 
          ? '1px solid rgba(0, 255, 136, 0.5)' 
          : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: checked 
          ? '0 0 20px rgba(0, 255, 136, 0.5), inset 0 0 10px rgba(0, 255, 136, 0.3)' 
          : 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
      }}
    >
      <Stack
        width={26}
        height={26}
        borderRadius={13}
        backgroundColor="$white"
        style={{
          transform: checked ? 'translateX(24px)' : 'translateX(0)',
          transition: 'transform 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      />
    </Stack>
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
    <Stack
      paddingVertical="$3"
      paddingHorizontal="$4"
      borderRadius={12}
      opacity={disabled ? 0.5 : 1}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <YStack space="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16} fontWeight="500">{label}</Text>
          <Stack
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius={8}
            style={{
              background: 'rgba(0, 212, 255, 0.2)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
            }}
          >
            <Text fontSize={14} color="$neonBlue" fontWeight="bold">{value}%</Text>
          </Stack>
        </XStack>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          max={100}
          step={5}
          disabled={disabled}
        >
          <Slider.Track 
            height={10}
            borderRadius={5}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Slider.TrackActive 
              style={{
                background: 'linear-gradient(90deg, #00D4FF 0%, #0099CC 100%)',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
              }}
            />
          </Slider.Track>
          <Slider.Thumb
            size="$3"
            circular
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 212, 255, 0.4)',
              border: '2px solid #00D4FF',
            }}
          />
        </Slider>
      </YStack>
    </Stack>
  );
}