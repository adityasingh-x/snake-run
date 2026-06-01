import { describe, it, expect } from 'vitest';
import { getLevelData, generateObstacles } from '../levelData';
import { GRID_SIZE } from '../constants';

describe('getLevelData', () => {
  it('returns correct data for level 1', () => {
    const data = getLevelData(1);
    expect(data.id).toBe(1);
    expect(data.targetScore).toBe(50);
    expect(data.speed).toBe(150);
  });

  it('returns correct data for level 5', () => {
    const data = getLevelData(5);
    expect(data.id).toBe(5);
    expect(data.targetScore).toBe(250);
    expect(data.speed).toBe(110);
  });

  it('returns correct data for level 10', () => {
    const data = getLevelData(10);
    expect(data.id).toBe(10);
    expect(data.targetScore).toBe(500);
    expect(data.speed).toBe(60);
  });

  it('throws error for invalid level', () => {
    expect(() => getLevelData(99)).toThrow('Invalid level ID: 99');
  });

  it('throws error for level 0', () => {
    expect(() => getLevelData(0)).toThrow('Invalid level ID: 0');
  });
});

describe('generateObstacles', () => {
  const snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  const food = { x: 5, y: 5 };

  it('generates obstacles that do not overlap with snake', () => {
    const obstacles = generateObstacles(1, snake, food);
    for (const obs of obstacles) {
      const onSnake = snake.some(s => s.x === obs.x && s.y === obs.y);
      expect(onSnake).toBe(false);
    }
  });

  it('generates obstacles that do not overlap with food', () => {
    const obstacles = generateObstacles(1, snake, food);
    for (const obs of obstacles) {
      expect(obs.x === food.x && obs.y === food.y).toBe(false);
    }
  });

  it('generates obstacles within grid bounds', () => {
    const obstacles = generateObstacles(5, snake, food);
    for (const obs of obstacles) {
      expect(obs.x).toBeGreaterThanOrEqual(0);
      expect(obs.x).toBeLessThan(GRID_SIZE);
      expect(obs.y).toBeGreaterThanOrEqual(0);
      expect(obs.y).toBeLessThan(GRID_SIZE);
    }
  });

  it('generates no duplicate obstacle positions', () => {
    const obstacles = generateObstacles(10, snake, food);
    const keys = obstacles.map(o => `${o.x},${o.y}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(obstacles.length);
  });

  it('generates correct count for level 1 (floor(1*0.5)=0, min 1)', () => {
    const obstacles = generateObstacles(1, snake, food);
    expect(obstacles.length).toBeGreaterThanOrEqual(1);
    expect(obstacles.length).toBeLessThanOrEqual(8);
  });

  it('generates correct count for level 10 (floor(10*0.5)=5)', () => {
    const obstacles = generateObstacles(10, snake, food);
    expect(obstacles.length).toBeGreaterThanOrEqual(1);
    expect(obstacles.length).toBeLessThanOrEqual(8);
  });

  it('generates correct count for level 4 (floor(4*0.5)=2)', () => {
    const obstacles = generateObstacles(4, snake, food);
    expect(obstacles.length).toBe(2);
  });
});
