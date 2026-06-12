import { describe, it, expect } from 'vitest';
import { getMultiplier, MILESTONES } from '../snake';

describe('getMultiplier', () => {
  it('returns 1 for lengths below 10', () => {
    expect(getMultiplier(3)).toBe(1);
    expect(getMultiplier(5)).toBe(1);
    expect(getMultiplier(9)).toBe(1);
  });

  it('returns 2 for lengths 10-19', () => {
    expect(getMultiplier(10)).toBe(2);
    expect(getMultiplier(15)).toBe(2);
    expect(getMultiplier(19)).toBe(2);
  });

  it('returns 3 for lengths 20-29', () => {
    expect(getMultiplier(20)).toBe(3);
    expect(getMultiplier(25)).toBe(3);
    expect(getMultiplier(29)).toBe(3);
  });

  it('returns 4 for lengths 30-49', () => {
    expect(getMultiplier(30)).toBe(4);
    expect(getMultiplier(40)).toBe(4);
    expect(getMultiplier(49)).toBe(4);
  });

  it('returns 5 for length 50+', () => {
    expect(getMultiplier(50)).toBe(5);
    expect(getMultiplier(75)).toBe(5);
    expect(getMultiplier(100)).toBe(5);
  });
});

describe('MILESTONES', () => {
  it('has expected tier boundaries', () => {
    expect(MILESTONES).toEqual([10, 20, 30, 50]);
  });

  it('each milestone is a tier-up boundary', () => {
    for (const m of MILESTONES) {
      expect(getMultiplier(m)).toBeGreaterThan(getMultiplier(m - 1));
    }
  });
});
