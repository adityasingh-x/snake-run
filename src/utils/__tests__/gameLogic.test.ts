import { describe, it, expect } from 'vitest';
import {
  positionsEqual,
  calculateNewHead,
  isWallCollision,
  isSelfCollision,
  isObstacleCollision,
  isCollision,
  spawnFood,
} from '../gameLogic';
import { GRID_SIZE } from '../constants';

describe('positionsEqual', () => {
  it('returns true for identical positions', () => {
    expect(positionsEqual({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(true);
  });

  it('returns false for different x', () => {
    expect(positionsEqual({ x: 1, y: 5 }, { x: 2, y: 5 })).toBe(false);
  });

  it('returns false for different y', () => {
    expect(positionsEqual({ x: 5, y: 1 }, { x: 5, y: 2 })).toBe(false);
  });

  it('returns false for completely different positions', () => {
    expect(positionsEqual({ x: 0, y: 0 }, { x: 19, y: 19 })).toBe(false);
  });
});

describe('calculateNewHead', () => {
  const head = { x: 10, y: 10 };

  it('moves UP (decrements y)', () => {
    expect(calculateNewHead(head, 'UP')).toEqual({ x: 10, y: 9 });
  });

  it('moves DOWN (increments y)', () => {
    expect(calculateNewHead(head, 'DOWN')).toEqual({ x: 10, y: 11 });
  });

  it('moves LEFT (decrements x)', () => {
    expect(calculateNewHead(head, 'LEFT')).toEqual({ x: 9, y: 10 });
  });

  it('moves RIGHT (increments x)', () => {
    expect(calculateNewHead(head, 'RIGHT')).toEqual({ x: 11, y: 10 });
  });
});

describe('isWallCollision', () => {
  it('returns true for x < 0', () => {
    expect(isWallCollision({ x: -1, y: 10 })).toBe(true);
  });

  it('returns true for x >= GRID_SIZE', () => {
    expect(isWallCollision({ x: GRID_SIZE, y: 10 })).toBe(true);
  });

  it('returns true for y < 0', () => {
    expect(isWallCollision({ x: 10, y: -1 })).toBe(true);
  });

  it('returns true for y >= GRID_SIZE', () => {
    expect(isWallCollision({ x: 10, y: GRID_SIZE })).toBe(true);
  });

  it('returns true for top-left corner out of bounds', () => {
    expect(isWallCollision({ x: -1, y: -1 })).toBe(true);
  });

  it('returns true for bottom-right corner out of bounds', () => {
    expect(isWallCollision({ x: GRID_SIZE, y: GRID_SIZE })).toBe(true);
  });

  it('returns false for position inside grid', () => {
    expect(isWallCollision({ x: 10, y: 10 })).toBe(false);
  });

  it('returns false for top-left corner (0,0)', () => {
    expect(isWallCollision({ x: 0, y: 0 })).toBe(false);
  });

  it('returns false for bottom-right corner', () => {
    expect(isWallCollision({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })).toBe(false);
  });
});

describe('isSelfCollision', () => {
  const snake = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ];

  it('returns true when head overlaps body', () => {
    expect(isSelfCollision({ x: 4, y: 5 }, snake)).toBe(true);
  });

  it('returns false when head is not on body', () => {
    expect(isSelfCollision({ x: 6, y: 5 }, snake)).toBe(false);
  });

  it('returns false when head overlaps tail (tail moves away)', () => {
    expect(isSelfCollision({ x: 3, y: 5 }, snake)).toBe(false);
  });
});

describe('isObstacleCollision', () => {
  const obstacles = [
    { x: 5, y: 5 },
    { x: 10, y: 10 },
  ];

  it('returns true when position matches obstacle', () => {
    expect(isObstacleCollision({ x: 5, y: 5 }, obstacles)).toBe(true);
  });

  it('returns false when position does not match', () => {
    expect(isObstacleCollision({ x: 0, y: 0 }, obstacles)).toBe(false);
  });

  it('returns false for empty obstacles array', () => {
    expect(isObstacleCollision({ x: 5, y: 5 }, [])).toBe(false);
  });
});

describe('isCollision', () => {
  const snake = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ];
  const obstacles = [{ x: 10, y: 10 }];

  it('returns true for wall collision', () => {
    expect(isCollision({ x: -1, y: 5 }, snake, obstacles)).toBe(true);
  });

  it('returns true for self collision', () => {
    expect(isCollision({ x: 4, y: 5 }, snake, obstacles)).toBe(true);
  });

  it('returns true for obstacle collision', () => {
    expect(isCollision({ x: 10, y: 10 }, snake, obstacles)).toBe(true);
  });

  it('returns false for safe position', () => {
    expect(isCollision({ x: 6, y: 5 }, snake, obstacles)).toBe(false);
  });
});

describe('spawnFood', () => {
  const snake = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ];

  it('returns a position not on the snake', () => {
    const food = spawnFood(snake, []);
    const isOnSnake = snake.some(s => positionsEqual(s, food));
    expect(isOnSnake).toBe(false);
  });

  it('returns a position not on obstacles', () => {
    const obstacles = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const food = spawnFood(snake, obstacles);
    const isOnObstacle = obstacles.some(o => positionsEqual(o, food));
    expect(isOnObstacle).toBe(false);
  });

  it('returns position within grid bounds', () => {
    const food = spawnFood(snake, []);
    expect(food.x).toBeGreaterThanOrEqual(0);
    expect(food.x).toBeLessThan(GRID_SIZE);
    expect(food.y).toBeGreaterThanOrEqual(0);
    expect(food.y).toBeLessThan(GRID_SIZE);
  });

  it('returns snake head as fallback when grid is full', () => {
    const fullSnake: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        fullSnake.push({ x, y });
      }
    }
    const food = spawnFood(fullSnake, []);
    expect(positionsEqual(food, fullSnake[0])).toBe(true);
  });
});
