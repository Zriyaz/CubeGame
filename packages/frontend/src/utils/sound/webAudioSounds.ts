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

  // Power up sound - switch turning on
  playPowerUp() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Rising sweep
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
    
    // Add a "click" at the end
    setTimeout(() => this.playTone(1200, 0.05, 'square', 0.2), 150);
  }

  // Power down sound - switch turning off
  playPowerDown() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Falling sweep
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
    
    // Add a low "thud" at the end
    setTimeout(() => this.playTone(80, 0.1, 'sine', 0.3), 150);
  }

  // Background music - dynamic gaming soundtrack
  private bgMusicNodes: { oscillator: OscillatorNode; gainNode: GainNode }[] = [];
  private bgMusicIntervals: number[] = [];
  private sequenceStep: number = 0;

  playBackgroundMusic() {
    if (!this.enabled) return;
    
    this.stopBackgroundMusic(); // Stop any existing music
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // Create a more complex gaming soundtrack
    // Bass line - gives the foundation
    const createBassline = () => {
      const bassNotes = [55, 55, 82.5, 55, 73.5, 55, 82.5, 92.5]; // A, A, E, A, D, A, E, F#
      let bassIndex = 0;
      
      const playBass = () => {
        const freq = bassNotes[bassIndex % bassNotes.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 15;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        
        bassIndex++;
      };
      
      playBass(); // Play immediately
      return window.setInterval(playBass, 500); // 120 BPM
    };
    
    // Melody line - catchy gaming tune
    const createMelody = () => {
      const melodyNotes = [
        440, 0, 523, 440,    // A, rest, C, A
        659, 523, 440, 392,  // E, C, A, G
        349, 0, 440, 349,    // F, rest, A, F
        523, 440, 349, 330,  // C, A, F, E
      ];
      let melodyIndex = 0;
      
      const playMelody = () => {
        const freq = melodyNotes[melodyIndex % melodyNotes.length];
        if (freq > 0) { // 0 means rest
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'square';
          osc.frequency.value = freq;
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.25);
        }
        melodyIndex++;
      };
      
      return window.setInterval(playMelody, 250); // 16th notes at 120 BPM
    };
    
    // Arpeggiator - adds movement and energy
    const createArpeggio = () => {
      const chords = [
        [220, 277, 330, 440],     // A minor
        [196, 247, 294, 392],     // G major
        [175, 220, 262, 349],     // F major
        [165, 208, 247, 330],     // E minor
      ];
      let chordIndex = 0;
      let noteIndex = 0;
      
      const playArp = () => {
        const currentChord = chords[Math.floor(chordIndex / 16) % chords.length];
        const freq = currentChord[noteIndex % currentChord.length];
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq * 2; // Higher octave
        
        filter.type = 'bandpass';
        filter.frequency.value = freq * 2;
        filter.Q.value = 5;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        
        noteIndex = (noteIndex + 1) % 4;
        if (noteIndex === 0) chordIndex++;
      };
      
      return window.setInterval(playArp, 125); // 32nd notes
    };
    
    // Percussion - adds rhythm and drive
    const createDrums = () => {
      let drumStep = 0;
      
      const playDrum = () => {
        const pattern = drumStep % 8;
        
        // Kick drum on 1 and 5
        if (pattern === 0 || pattern === 4) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.frequency.setValueAtTime(60, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
          
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
        }
        
        // Hi-hat on off-beats
        if (pattern % 2 === 1) {
          const noise = ctx.createBufferSource();
          const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          noise.buffer = noiseBuffer;
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 8000;
          
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start(ctx.currentTime);
        }
        
        drumStep++;
      };
      
      playDrum(); // Play immediately
      return window.setInterval(playDrum, 250); // 8th notes
    };
    
    // Start all parts with slight delays for a buildup effect
    this.bgMusicIntervals.push(createDrums());
    
    setTimeout(() => {
      this.bgMusicIntervals.push(createBassline());
    }, 2000);
    
    setTimeout(() => {
      this.bgMusicIntervals.push(createArpeggio());
    }, 4000);
    
    setTimeout(() => {
      this.bgMusicIntervals.push(createMelody());
    }, 6000);
  }

  stopBackgroundMusic() {
    // Stop all oscillators
    this.bgMusicNodes.forEach(({ oscillator, gainNode }) => {
      try {
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.getAudioContext().currentTime + 0.5);
        oscillator.stop(this.getAudioContext().currentTime + 0.5);
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.bgMusicNodes = [];
    
    // Clear all intervals
    this.bgMusicIntervals.forEach(interval => clearInterval(interval));
    this.bgMusicIntervals = [];
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

  playNotification() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    
    // Create a pleasant bell-like notification sound
    const now = ctx.currentTime;
    const fundamental = 800; // High pitched bell
    
    // Create 3 harmonics for a rich bell sound
    [1, 2, 3].forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.value = fundamental * harmonic;
      
      filter.type = 'bandpass';
      filter.frequency.value = fundamental * harmonic;
      filter.Q.value = 30;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Amplitude envelope for bell-like decay
      const volume = 0.15 / (harmonic * 0.8);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 / harmonic);
      
      osc.start(now);
      osc.stop(now + 1.5);
    });
    
    // Add a subtle click at the beginning
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.value = 2000;
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    
    clickGain.gain.setValueAtTime(0.05, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    
    click.start(now);
    click.stop(now + 0.02);
  }

  playInvitation() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    
    // Create a more elaborate, attention-getting sound for invitations
    const now = ctx.currentTime;
    
    // Play a short ascending melody
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      filter.type = 'highpass';
      filter.frequency.value = 200;
      filter.Q.value = 1;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      const startTime = now + (index * 0.15);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
    
    // Add harmonics for richness
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq * 2; // Octave higher
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const startTime = now + (index * 0.15);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }
}

export const webAudioSounds = new WebAudioSounds();