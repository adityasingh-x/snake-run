import { describe, it, expect, beforeEach } from 'vitest';
import { loadHighScore, saveHighScore, loadLastUnlockedLevel, saveLastUnlockedLevel } from '../storage';

const STORAGE_KEY = 'snakeHighScore';
const LAST_UNLOCKED_KEY = 'snakeLastUnlockedLevel';

describe('loadHighScore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns 0 when no value stored', () => {
    expect(loadHighScore()).toBe(0);
  });

  it('returns stored value', () => {
    localStorage.setItem(STORAGE_KEY, '250');
    expect(loadHighScore()).toBe(250);
  });

  it('returns 0 for corrupted data', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number');
    expect(loadHighScore()).toBe(0);
  });

  it('returns 0 for empty string (falsy, falls back to "0")', () => {
    localStorage.setItem(STORAGE_KEY, '');
    expect(loadHighScore()).toBe(0);
  });

  it('returns 0 when localStorage throws (private browsing)', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => { throw new Error('SecurityError'); };
    try {
      expect(loadHighScore()).toBe(0);
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });
});

describe('saveHighScore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves score when no previous high score', () => {
    saveHighScore(100);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('100');
  });

  it('saves score when higher than previous', () => {
    localStorage.setItem(STORAGE_KEY, '50');
    saveHighScore(100);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('100');
  });

  it('does not save when score is lower than previous', () => {
    localStorage.setItem(STORAGE_KEY, '200');
    saveHighScore(100);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('200');
  });

  it('does not save when score equals previous', () => {
    localStorage.setItem(STORAGE_KEY, '100');
    saveHighScore(100);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('100');
  });

  it('does not throw when localStorage.getItem throws (private browsing)', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => { throw new Error('SecurityError'); };
    try {
      expect(() => saveHighScore(500)).not.toThrow();
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });

  it('does not throw when localStorage.setItem throws (quota exceeded)', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    try {
      expect(() => saveHighScore(500)).not.toThrow();
    } finally {
      localStorage.setItem = originalSetItem;
    }
  });
});

describe('loadLastUnlockedLevel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns 1 when no value stored', () => {
    expect(loadLastUnlockedLevel()).toBe(1);
  });

  it('returns stored value', () => {
    localStorage.setItem(LAST_UNLOCKED_KEY, '5');
    expect(loadLastUnlockedLevel()).toBe(5);
  });

  it('returns 1 for corrupted data', () => {
    localStorage.setItem(LAST_UNLOCKED_KEY, 'not-a-number');
    expect(loadLastUnlockedLevel()).toBe(1);
  });

  it('returns 1 when localStorage throws (private browsing)', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => { throw new Error('SecurityError'); };
    try {
      expect(loadLastUnlockedLevel()).toBe(1);
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });
});

describe('saveLastUnlockedLevel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves level when no previous value', () => {
    saveLastUnlockedLevel(3);
    expect(localStorage.getItem(LAST_UNLOCKED_KEY)).toBe('3');
  });

  it('saves level when higher than stored', () => {
    localStorage.setItem(LAST_UNLOCKED_KEY, '2');
    saveLastUnlockedLevel(5);
    expect(localStorage.getItem(LAST_UNLOCKED_KEY)).toBe('5');
  });

  it('does not overwrite when level is lower than stored', () => {
    localStorage.setItem(LAST_UNLOCKED_KEY, '5');
    saveLastUnlockedLevel(3);
    expect(localStorage.getItem(LAST_UNLOCKED_KEY)).toBe('5');
  });

  it('does not overwrite when level equals stored', () => {
    localStorage.setItem(LAST_UNLOCKED_KEY, '3');
    saveLastUnlockedLevel(3);
    expect(localStorage.getItem(LAST_UNLOCKED_KEY)).toBe('3');
  });

  it('does not throw when localStorage.getItem throws (private browsing)', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => { throw new Error('SecurityError'); };
    try {
      expect(() => saveLastUnlockedLevel(5)).not.toThrow();
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });

  it('does not throw when localStorage.setItem throws (quota exceeded)', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    try {
      expect(() => saveLastUnlockedLevel(5)).not.toThrow();
    } finally {
      localStorage.setItem = originalSetItem;
    }
  });
});
