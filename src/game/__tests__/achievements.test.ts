import { describe, it, expect, beforeEach } from 'vitest';
import { loadAchievements, saveAchievement, checkAchievements } from '../achievements';
import type { GameState } from '../types';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [{ x: 10, y: 10 }],
    food: { x: 5, y: 5 },
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    status: 'idle',
    score: 0,
    highScore: 0,
    level: 1,
    obstacles: [],
    lastUnlockedLevel: 1,
    foodEaten: 0,
    isEndless: false,
    ...overrides,
  };
}

describe('achievements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadAchievements', () => {
    it('returns all achievements unlocked: false initially', () => {
      const achievements = loadAchievements();
      expect(achievements).toHaveLength(3);
      achievements.forEach(a => expect(a.unlocked).toBe(false));
    });

    it('merges persisted state', () => {
      saveAchievement('beat_game');
      const achievements = loadAchievements();
      const beatGame = achievements.find(a => a.id === 'beat_game');
      expect(beatGame?.unlocked).toBe(true);
    });
  });

  describe('saveAchievement', () => {
    it('persists correctly', () => {
      saveAchievement('score_500');
      const achievements = loadAchievements();
      const score500 = achievements.find(a => a.id === 'score_500');
      expect(score500?.unlocked).toBe(true);
    });

    it('does not re-award if already unlocked', () => {
      saveAchievement('beat_game');
      saveAchievement('beat_game');
      const achievements = loadAchievements();
      const beatGame = achievements.filter(a => a.id === 'beat_game');
      expect(beatGame).toHaveLength(1);
      expect(beatGame[0].unlocked).toBe(true);
    });
  });

  describe('checkAchievements', () => {
    it('detects beat_game on win', () => {
      const prevState = makeState({ status: 'playing', score: 300 });
      const state = makeState({ status: 'won', score: 300 });
      const unlocked = checkAchievements(state, prevState, false, new Set());
      expect(unlocked).toContain('beat_game');
    });

    it('detects score_500 when crossing threshold', () => {
      const prevState = makeState({ status: 'playing', score: 490 });
      const state = makeState({ status: 'playing', score: 500 });
      const unlocked = checkAchievements(state, prevState, false, new Set());
      expect(unlocked).toContain('score_500');
    });

    it('detects no_pause when win without pause', () => {
      const prevState = makeState({ status: 'playing', score: 300 });
      const state = makeState({ status: 'won', score: 300 });
      const unlocked = checkAchievements(state, prevState, false, new Set());
      expect(unlocked).toContain('no_pause');
    });

    it('does NOT award no_pause when wasPaused=true', () => {
      const prevState = makeState({ status: 'playing', score: 300 });
      const state = makeState({ status: 'won', score: 300 });
      const unlocked = checkAchievements(state, prevState, true, new Set());
      expect(unlocked).not.toContain('no_pause');
    });

    it('does not re-award already unlocked achievements', () => {
      saveAchievement('beat_game');
      const prevState = makeState({ status: 'playing', score: 300 });
      const state = makeState({ status: 'won', score: 300 });
      const unlocked = checkAchievements(state, prevState, false, new Set(['beat_game']));
      expect(unlocked).not.toContain('beat_game');
    });
  });
});
