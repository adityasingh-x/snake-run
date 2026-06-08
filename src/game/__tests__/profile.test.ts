import { describe, it, expect, beforeEach } from 'vitest';
import { loadGameProfile, saveGameProfile } from '../profile';

describe('profile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns correct shape with all fields', () => {
    localStorage.setItem('snakeLastUnlockedLevel', '3');
    localStorage.setItem('snakeHighScore', '200');
    localStorage.setItem('snakeStatsGamesPlayed', '5');
    localStorage.setItem('snakeStatsTotalFood', '42');
    localStorage.setItem('snakeStatsBestLevel', '3');
    localStorage.setItem('snakeAchievements', JSON.stringify(['score_500']));

    const profile = loadGameProfile();

    expect(profile.progress.lastUnlockedLevel).toBe(3);
    expect(profile.progress.highScore).toBe(200);
    expect(profile.statistics.gamesPlayed).toBe(5);
    expect(profile.statistics.totalFood).toBe(42);
    expect(profile.statistics.bestLevel).toBe(3);
    expect(profile.statistics.highScore).toBe(200);
    expect(profile.achievements.find(a => a.id === 'score_500')?.unlocked).toBe(true);
  });

  it('handles missing localStorage gracefully with defaults', () => {
    const profile = loadGameProfile();

    expect(profile.progress.lastUnlockedLevel).toBe(1);
    expect(profile.progress.highScore).toBe(0);
    expect(profile.statistics.gamesPlayed).toBe(0);
    expect(profile.statistics.highScore).toBe(0);
    expect(profile.achievements).toHaveLength(3);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('snakeLastUnlockedLevel', 'not-a-number');
    localStorage.setItem('snakeAchievements', 'not-json');
    localStorage.setItem('snakeStatsGamesPlayed', 'bad');

    const profile = loadGameProfile();

    expect(profile.progress.lastUnlockedLevel).toBe(1);
    expect(profile.achievements.every(a => !a.unlocked)).toBe(true);
    expect(profile.statistics.gamesPlayed).toBe(0);
    expect(profile.statistics.highScore).toBe(0);
  });

  it('saveGameProfile persists values', () => {
    const profile = loadGameProfile();
    profile.progress.lastUnlockedLevel = 5;
    profile.progress.highScore = 500;
    saveGameProfile(profile);

    expect(localStorage.getItem('snakeLastUnlockedLevel')).toBe('5');
    expect(localStorage.getItem('snakeHighScore')).toBe('500');
  });
});
