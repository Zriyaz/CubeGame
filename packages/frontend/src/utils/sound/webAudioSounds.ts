/**
 * Web Audio API sound generator for basic game sounds
 * This creates simple sounds without requiring external files
 */

class WebAudioSounds {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Restore sound preference from localStorage
    const savedPreference = localStorage.getItem('soundEnabled');
    if (savedPreference !== null) {
      this.enabled = savedPreference === 'true';
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play tone:', error);
    }
  }

  // Cell click sound - short, high-pitched beep
  playCellClick() {
    this.playTone(800, 0.1, 'sine', 0.2);
  }

  // Cell capture sound - satisfying "pop"
  playCellCapture() {
    const ctx = this.getAudioContext();
    
    // Create a short burst with envelope
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  // Player join sound - ascending tone
  playPlayerJoin() {
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  // Game start sound - fanfare
  playGameStart() {
    this.playTone(440, 0.15, 'square', 0.3); // A4
    setTimeout(() => this.playTone(554, 0.15, 'square', 0.3), 150); // C#5
    setTimeout(() => this.playTone(659, 0.3, 'square', 0.3), 300); // E5
  }

  // Victory sound - triumphant melody
  playVictory() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square', 0.3), i * 150);
    });
  }

  // Defeat sound - descending tones
  playDefeat() {
    const notes = [440, 392, 349, 293]; // A4, G4, F4, D4
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sawtooth', 0.2), i * 200);
    });
  }

  // Error sound
  playError() {
    this.playTone(200, 0.3, 'sawtooth', 0.3);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled.toString());
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
  }

  get isEnabled() {
    return this.enabled;
  }
}

export const webAudioSounds = new WebAudioSounds();