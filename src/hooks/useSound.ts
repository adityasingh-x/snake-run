import { useCallback } from 'react';

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

const sharedEnabledRef = { current: loadSoundPreference() };
const sharedCtxRef = { current: null as AudioContext | null };

export function useSound() {
  const initAudio = useCallback(() => {
    if (!sharedCtxRef.current) {
      sharedCtxRef.current = new AudioContext();
    }
    if (sharedCtxRef.current.state === 'suspended') {
      sharedCtxRef.current.resume();
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'square') => {
      if (!sharedEnabledRef.current) return;
      const ctx = sharedCtxRef.current;
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
    },
    []
  );

  const playEat = useCallback(() => {
    playTone(600, 0.1, 'sine');
    setTimeout(() => playTone(800, 0.1, 'sine'), 50);
  }, [playTone]);

  const playCollision = useCallback(() => {
    playTone(150, 0.3, 'sawtooth');
  }, [playTone]);

  const playLevelUp = useCallback(() => {
    playTone(400, 0.15, 'sine');
    setTimeout(() => playTone(600, 0.15, 'sine'), 100);
    setTimeout(() => playTone(800, 0.2, 'sine'), 200);
  }, [playTone]);

  const toggleSound = useCallback(() => {
    sharedEnabledRef.current = !sharedEnabledRef.current;
    saveSoundPreference(sharedEnabledRef.current);
    return sharedEnabledRef.current;
  }, []);

  const isEnabled = useCallback(() => sharedEnabledRef.current, []);

  return { initAudio, playEat, playCollision, playLevelUp, toggleSound, isEnabled };
}
