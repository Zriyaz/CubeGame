import { Howl, Howler } from 'howler';
import { webAudioSounds } from './webAudioSounds';

export interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  sprite?: Record<string, [number, number]>;
  html5?: boolean;
  preload?: boolean;
}

export class GameSoundManager {
  private sounds: Map<string, Howl> = new Map();
  private enabled: boolean = true;
  
  constructor() {
    // Load sounds on initialization
    this.loadSounds();
    
    // Restore sound preference from localStorage
    const savedPreference = localStorage.getItem('soundEnabled');
    if (savedPreference !== null) {
      this.enabled = savedPreference === 'true';
    }
  }
  
  private loadSounds() {
    // Define all game sounds - only create when needed
    this.soundConfigs = {
      cellClick: {
        src: ['/sounds/cell-click.webm', '/sounds/cell-click.mp3'],
        volume: 0.5,
        html5: true,
        preload: false, // Don't preload
      },
      cellCapture: {
        src: ['/sounds/cell-capture.webm', '/sounds/cell-capture.mp3'],
        volume: 0.6,
        preload: false,
      },
      playerJoin: {
        src: ['/sounds/player-join.webm', '/sounds/player-join.mp3'],
        volume: 0.5,
        preload: false,
      },
      gameStart: {
        src: ['/sounds/game-start.webm', '/sounds/game-start.mp3'],
        volume: 0.8,
        preload: false,
      },
      victory: {
        src: ['/sounds/victory.webm', '/sounds/victory.mp3'],
        volume: 0.7,
        preload: false,
      },
      defeat: {
        src: ['/sounds/defeat.webm', '/sounds/defeat.mp3'],
        volume: 0.7,
        preload: false,
      },
      countdown: {
        src: ['/sounds/countdown.webm', '/sounds/countdown.mp3'],
        volume: 0.6,
        preload: false,
        sprite: {
          three: [0, 1000],
          two: [1000, 1000],
          one: [2000, 1000],
          go: [3000, 1500],
        },
      },
      backgroundMusic: {
        src: ['/sounds/bg-music.webm', '/sounds/bg-music.mp3'],
        volume: 0.3,
        loop: true,
        html5: true,
        preload: false,
      },
    };
  }
  
  private soundConfigs: Record<string, SoundConfig> = {};
  
  play(soundName: string, sprite?: string): number | undefined {
    if (!this.enabled) return;
    
    // Use Web Audio API as fallback for basic sounds
    const useWebAudioFallback = () => {
      switch (soundName) {
        case 'cellClick':
          webAudioSounds.playCellClick();
          break;
        case 'cellCapture':
          webAudioSounds.playCellCapture();
          break;
        case 'playerJoin':
          webAudioSounds.playPlayerJoin();
          break;
        case 'gameStart':
          webAudioSounds.playGameStart();
          break;
        case 'victory':
          webAudioSounds.playVictory();
          break;
        case 'defeat':
          webAudioSounds.playDefeat();
          break;
        case 'powerUp':
          webAudioSounds.playPowerUp();
          break;
        case 'powerDown':
          webAudioSounds.playPowerDown();
          break;
        case 'error':
          webAudioSounds.playError();
          break;
        case 'backgroundMusic':
          webAudioSounds.playBackgroundMusic();
          break;
        default:
          console.debug(`No Web Audio fallback for sound: ${soundName}`);
      }
    };
    
    try {
      // Lazy load sound if not already loaded
      let sound = this.sounds.get(soundName);
      if (!sound && this.soundConfigs[soundName]) {
        sound = new Howl({
          ...this.soundConfigs[soundName],
          onloaderror: (id, error) => {
            console.warn(`Failed to load sound "${soundName}", using Web Audio fallback`);
            useWebAudioFallback();
          },
          onplayerror: (id, error) => {
            console.warn(`Failed to play sound "${soundName}", using Web Audio fallback`);
            useWebAudioFallback();
          }
        });
        this.sounds.set(soundName, sound);
      }
      
      if (sound && sound.state() === 'loaded') {
        if (sprite) {
          return sound.play(sprite);
        } else {
          return sound.play();
        }
      } else {
        // Use Web Audio fallback immediately if sound not loaded
        useWebAudioFallback();
      }
    } catch (error) {
      console.warn(`Error playing sound "${soundName}", using Web Audio fallback:`, error);
      useWebAudioFallback();
    }
  }
  
  stop(soundName: string, id?: number) {
    // Handle background music specially
    if (soundName === 'backgroundMusic') {
      webAudioSounds.stopBackgroundMusic();
    }
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      if (id) {
        sound.stop(id);
      } else {
        sound.stop();
      }
    }
  }
  
  pause(soundName: string, id?: number) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.pause(id);
    }
  }
  
  resume(soundName: string, id?: number) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.play(id);
    }
  }
  
  fade(soundName: string, from: number, to: number, duration: number, id?: number) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.fade(from, to, duration, id);
    }
  }
  
  setVolume(volume: number) {
    Howler.volume(volume);
  }
  
  setSoundVolume(soundName: string, volume: number) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.volume(volume);
    }
  }
  
  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled.toString());
    
    // Sync with Web Audio sounds
    webAudioSounds.setEnabled(this.enabled);
    
    if (!this.enabled) {
      Howler.stop();
    }
    
    return this.enabled;
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
    
    // Sync with Web Audio sounds
    webAudioSounds.setEnabled(enabled);
    
    if (!enabled) {
      Howler.stop();
    }
  }
  
  get isEnabled() {
    return this.enabled;
  }
  
  preload() {
    // Only preload essential sounds
    const essentialSounds = ['cellClick', 'cellCapture'];
    
    essentialSounds.forEach(soundName => {
      if (!this.sounds.has(soundName) && this.soundConfigs[soundName]) {
        const sound = new Howl({ 
          ...this.soundConfigs[soundName], 
          preload: true 
        });
        this.sounds.set(soundName, sound);
      }
    });
  }
  
  cleanup() {
    // Unload all sounds
    this.sounds.forEach(sound => {
      sound.unload();
    });
    this.sounds.clear();
  }
}

// Singleton instance
export const soundManager = new GameSoundManager();