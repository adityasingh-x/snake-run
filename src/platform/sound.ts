const SOUND_KEY = 'snakeSoundEnabled';

function loadSoundPreference(): boolean {
  try {
    const val = localStorage.getItem(SOUND_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

function saveSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export class SoundManager {
  private enabled: boolean;
  private ctx: AudioContext | null = null;

  constructor() {
    this.enabled = loadSoundPreference();
  }

  initAudio() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'square') {
    if (!this.enabled) return;
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore audio errors
    }
  }

  // Note: setTimeout here will leak if SoundManager is destroyed mid-play.
  // Acceptable for a singleton that lives for the page lifetime.
  playEat() {
    this.playTone(600, 0.1, 'sine');
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 50);
  }

  playCollision() {
    this.playTone(150, 0.3, 'sawtooth');
  }

  playLevelUp() {
    this.playTone(400, 0.15, 'sine');
    setTimeout(() => this.playTone(600, 0.15, 'sine'), 100);
    setTimeout(() => this.playTone(800, 0.2, 'sine'), 200);
  }

  toggleSound(): boolean {
    this.enabled = !this.enabled;
    saveSoundPreference(this.enabled);
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const sharedSoundManager = new SoundManager();
