import { describe, it, expect, beforeEach } from 'vitest';
import { loadHighScore, saveHighScore } from '../storage';

const STORAGE_KEY = 'snakeHighScore';

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
    expect(loadHighScore()).toBeNaN();
  });

  it('returns 0 for empty string (falsy, falls back to "0")', () => {
    localStorage.setItem(STORAGE_KEY, '');
    expect(loadHighScore()).toBe(0);
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
});
