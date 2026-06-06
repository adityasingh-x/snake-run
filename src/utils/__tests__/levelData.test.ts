import { describe, it, expect } from 'vitest';
import { getLevelData, generateObstacles } from '../levelData';
import { GRID_SIZE } from '../constants';
import { INITIAL_SNAKE } from '../../game/constants';

describe('getLevelData', () => {
  it('returns correct data for level 1', () => {
    const data = getLevelData(1);
    expect(data.id).toBe(1);
    expect(data.foodRequired).toBe(10);
    expect(data.speed).toBe(150);
  });

  it('returns correct data for level 5', () => {
    const data = getLevelData(5);
    expect(data.id).toBe(5);
    expect(data.foodRequired).toBe(18);
    expect(data.speed).toBe(115);
  });

  it('returns correct data for level 10', () => {
    const data = getLevelData(10);
    expect(data.id).toBe(10);
    expect(data.foodRequired).toBe(30);
    expect(data.speed).toBe(100);
  });

  it('throws error for invalid level', () => {
    expect(() => getLevelData(99)).toThrow('Invalid level ID: 99');
  });

  it('throws error for level 0', () => {
    expect(() => getLevelData(0)).toThrow('Invalid level ID: 0');
  });
});

describe('generateObstacles', () => {
  it('Level 1 has zero obstacles', () => {
    expect(generateObstacles(1)).toEqual([]);
  });

  it('levels 2-10 have non-empty layouts', () => {
    for (let i = 2; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      expect(obstacles.length).toBeGreaterThan(0);
    }
  });

  it('generates obstacles within grid bounds', () => {
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      for (const obs of obstacles) {
        expect(obs.x).toBeGreaterThanOrEqual(0);
        expect(obs.x).toBeLessThan(GRID_SIZE);
        expect(obs.y).toBeGreaterThanOrEqual(0);
        expect(obs.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('generates no duplicate obstacle positions', () => {
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      const keys = obstacles.map(o => `${o.x},${o.y}`);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(obstacles.length);
    }
  });

  it('is deterministic for all 10 levels', () => {
    for (let i = 1; i <= 10; i++) {
      expect(generateObstacles(i)).toEqual(generateObstacles(i));
      expect(generateObstacles(i)).toEqual(getLevelData(i).layout);
    }
  });
});

describe('layout validity', () => {
  it('no layout tile overlaps with INITIAL_SNAKE starting positions', () => {
    const snakeKeys = new Set(INITIAL_SNAKE.map(p => `${p.x},${p.y}`));
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      for (const obs of obstacles) {
        const key = `${obs.x},${obs.y}`;
        expect(snakeKeys.has(key)).toBe(false);
      }
    }
  });

  it('no layout tile is directly in front of initial snake head (RIGHT direction)', () => {
    const forbidden = { x: 11, y: 10 };
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      for (const obs of obstacles) {
        expect(obs.x === forbidden.x && obs.y === forbidden.y).toBe(false);
      }
    }
  });

  it('all layout tiles are within grid bounds [0, GRID_SIZE)', () => {
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      for (const obs of obstacles) {
        expect(obs.x).toBeGreaterThanOrEqual(0);
        expect(obs.x).toBeLessThan(GRID_SIZE);
        expect(obs.y).toBeGreaterThanOrEqual(0);
        expect(obs.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('no duplicate tiles within any single layout', () => {
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      const keys = obstacles.map(o => `${o.x},${o.y}`);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(obstacles.length);
    }
  });

  it('at least two of three legal first-tick directions are survivable', () => {
    const firstTickNeighbors = [
      { x: 11, y: 10 },
      { x: 10, y: 9 },
      { x: 10, y: 11 },
    ];
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      const obstacleKeys = new Set(obstacles.map(o => `${o.x},${o.y}`));
      const blocked = firstTickNeighbors.filter(n => obstacleKeys.has(`${n.x},${n.y}`));
      expect(blocked.length).toBeLessThan(2);
    }
  });
});

describe('level metadata', () => {
  it('each level has a non-empty name', () => {
    for (let i = 1; i <= 10; i++) {
      const data = getLevelData(i);
      expect(data.name.length).toBeGreaterThan(0);
    }
  });

  it('each level has a non-empty description', () => {
    for (let i = 1; i <= 10; i++) {
      const data = getLevelData(i);
      expect(data.description.length).toBeGreaterThan(0);
    }
  });

  it('returns correct name for level 1', () => {
    const data = getLevelData(1);
    expect(data.name).toBe('First Meal');
  });

  it('returns correct name for level 10', () => {
    const data = getLevelData(10);
    expect(data.name).toBe('Final Run');
  });

  it('all 10 levels exist', () => {
    for (let i = 1; i <= 10; i++) {
      const data = getLevelData(i);
      expect(data.id).toBe(i);
    }
  });
});
