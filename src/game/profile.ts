import { loadLastUnlockedLevel, loadHighScore } from './storage';
import { loadStats, type Stats } from './statistics';
import { loadAchievements, type Achievement } from './achievements';

export interface GameProfile {
  progress: {
    lastUnlockedLevel: number;
    highScore: number;
  };
  statistics: Stats;
  achievements: Achievement[];
}

export function loadGameProfile(): GameProfile {
  return {
    progress: {
      lastUnlockedLevel: loadLastUnlockedLevel(),
      highScore: loadHighScore(),
    },
    statistics: { ...loadStats(), highScore: loadHighScore() },
    achievements: loadAchievements(),
  };
}

export function saveGameProfile(profile: GameProfile): void {
  try {
    localStorage.setItem('snakeLastUnlockedLevel', profile.progress.lastUnlockedLevel.toString());
    localStorage.setItem('snakeHighScore', profile.progress.highScore.toString());
  } catch {
    // ignore
  }
}
