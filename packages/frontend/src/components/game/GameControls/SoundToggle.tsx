import { Button } from 'tamagui';
import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { soundManager } from '@/utils/sound/soundManager';

interface SoundToggleProps {
  size?: number;
}

export function SoundToggle({ size = 24 }: SoundToggleProps) {
  const [isEnabled, setIsEnabled] = useState(soundManager.isEnabled);

  const handleToggle = () => {
    const newState = soundManager.toggle();
    setIsEnabled(newState);
    
    // Play a sound to indicate the change (if enabled)
    if (newState) {
      soundManager.play('cellClick');
    }
  };

  return (
    <Button
      size="$4"
      circular
      icon={isEnabled ? <Volume2 size={size} /> : <VolumeX size={size} />}
      onPress={handleToggle}
      animation="quick"
      backgroundColor={isEnabled ? '$neonBlue' : '$gray8'}
      borderWidth={2}
      borderColor={isEnabled ? '$neonBlue' : '$gray6'}
      hoverStyle={{
        scale: 1.1,
        backgroundColor: isEnabled ? '$neonBlue' : '$gray7',
        borderColor: isEnabled ? '$neonBlue' : '$gray5',
      }}
      pressStyle={{
        scale: 0.95,
      }}
      style={{
        boxShadow: isEnabled ? '0 0 20px rgba(0, 255, 255, 0.5)' : 'none',
      }}
    />
  );
}