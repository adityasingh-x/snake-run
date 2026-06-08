import { describe, it, expect, beforeEach } from 'vitest';
import { loadStats, saveStats, incrementGamesPlayed, incrementTotalFood, updateBestLevel } from '../statistics';

describe('statistics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadStats', () => {
    it('returns defaults when empty', () => {
      const stats = loadStats();
      expect(stats.gamesPlayed).toBe(0);
      expect(stats.totalFood).toBe(0);
      expect(stats.bestLevel).toBe(1);
      expect(stats.highScore).toBe(0);
    });
  });

  describe('incrementGamesPlayed', () => {
    it('increments and persists', () => {
      incrementGamesPlayed();
      const stats = loadStats();
      expect(stats.gamesPlayed).toBe(1);

      incrementGamesPlayed();
      const stats2 = loadStats();
      expect(stats2.gamesPlayed).toBe(2);
    });
  });

  describe('incrementTotalFood', () => {
    it('accumulates correctly', () => {
      incrementTotalFood(5);
      incrementTotalFood(3);
      const stats = loadStats();
      expect(stats.totalFood).toBe(8);
    });
  });

  describe('updateBestLevel', () => {
    it('only saves if higher', () => {
      updateBestLevel(5);
      expect(loadStats().bestLevel).toBe(5);

      updateBestLevel(3);
      expect(loadStats().bestLevel).toBe(5);

      updateBestLevel(7);
      expect(loadStats().bestLevel).toBe(7);
    });
  });

  describe('saveStats', () => {
    it('persists all stats', () => {
      saveStats({ gamesPlayed: 10, totalFood: 50, bestLevel: 8, highScore: 300 });
      const stats = loadStats();
      expect(stats.gamesPlayed).toBe(10);
      expect(stats.totalFood).toBe(50);
      expect(stats.bestLevel).toBe(8);
    });
  });

  describe('round-trip', () => {
    it('saveStats + loadStats round-trips correctly', () => {
      saveStats({ gamesPlayed: 15, totalFood: 75, bestLevel: 9, highScore: 450 });
      const stats = loadStats();
      expect(stats.gamesPlayed).toBe(15);
      expect(stats.totalFood).toBe(75);
      expect(stats.bestLevel).toBe(9);
      expect(stats.highScore).toBe(0);
    });
  });

  describe('corruption resilience', () => {
    it('loadStats returns defaults when localStorage contains corrupt data', () => {
      localStorage.setItem('snakeStatsGamesPlayed', 'not-a-number');
      localStorage.setItem('snakeStatsTotalFood', 'garbage');
      localStorage.setItem('snakeStatsBestLevel', '%%%');
      const stats = loadStats();
      expect(stats.gamesPlayed).toBe(0);
      expect(stats.totalFood).toBe(0);
      expect(stats.bestLevel).toBe(1);
    });
  });
});
