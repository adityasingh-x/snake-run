import { describe, it, expect } from 'vitest';
import { getLevelData, generateObstacles, getPortalPositions } from '../levelData';
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

describe('wrap-around', () => {
  it('Level 5 has wrapAround: true', () => {
    const data = getLevelData(5);
    expect(data.wrapAround).toBe(true);
  });

  it('all other levels have wrapAround false or undefined', () => {
    for (let i = 1; i <= 10; i++) {
      if (i === 5) continue;
      const data = getLevelData(i);
      expect(data.wrapAround).toBeFalsy();
    }
  });
});

describe('portals', () => {
  it('Level 7 has exactly one portal pair', () => {
    const data = getLevelData(7);
    expect(data.portals).toBeDefined();
    expect(data.portals).toHaveLength(1);
    expect(data.portals![0]).toHaveLength(2);
  });

  it('all other levels have no portals', () => {
    for (let i = 1; i <= 10; i++) {
      if (i === 7) continue;
      const data = getLevelData(i);
      expect(data.portals).toBeUndefined();
    }
  });

  it('getPortalPositions(7) returns exactly 2 positions', () => {
    const positions = getPortalPositions(7);
    expect(positions).toHaveLength(2);
    expect(positions).toContainEqual({ x: 2, y: 4 });
    expect(positions).toContainEqual({ x: 16, y: 15 });
  });

  it('getPortalPositions returns [] for all non-portal levels', () => {
    for (let i = 1; i <= 10; i++) {
      if (i === 7) continue;
      expect(getPortalPositions(i)).toEqual([]);
    }
  });

  it('Level 7 portal tiles are within grid bounds', () => {
    const positions = getPortalPositions(7);
    for (const pos of positions) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThan(GRID_SIZE);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThan(GRID_SIZE);
    }
  });

  it('Level 7 portal entry and exit tiles do not overlap obstacles', () => {
    const obstacles = generateObstacles(7);
    const obstacleKeys = new Set(obstacles.map(o => `${o.x},${o.y}`));
    const portalPositions = getPortalPositions(7);
    for (const pos of portalPositions) {
      expect(obstacleKeys.has(`${pos.x},${pos.y}`)).toBe(false);
    }
  });

  it('Level 7 portal tiles do not overlap INITIAL_SNAKE positions', () => {
    const snakeKeys = new Set(INITIAL_SNAKE.map(p => `${p.x},${p.y}`));
    const portalPositions = getPortalPositions(7);
    for (const pos of portalPositions) {
      expect(snakeKeys.has(`${pos.x},${pos.y}`)).toBe(false);
    }
  });

  it('Level 7 portal entry and exit are distinct cells', () => {
    const positions = getPortalPositions(7);
    expect(positions[0].x === positions[1].x && positions[0].y === positions[1].y).toBe(false);
  });
});

describe('food spawn capacity', () => {
  it('each level has at least one free cell for food', () => {
    for (let i = 1; i <= 10; i++) {
      const data = getLevelData(i);
      const obstacleCount = data.layout.length;
      const snakeCount = INITIAL_SNAKE.length;
      const portalCount = getPortalPositions(i).length;
      const occupied = obstacleCount + snakeCount + portalCount;
      expect(GRID_SIZE * GRID_SIZE - occupied).toBeGreaterThanOrEqual(1);
    }
  });

  it('each level has enough free cells for all required food', () => {
    for (let i = 1; i <= 10; i++) {
      const data = getLevelData(i);
      const obstacleCount = data.layout.length;
      const snakeCount = INITIAL_SNAKE.length;
      const portalCount = getPortalPositions(i).length;
      const occupied = obstacleCount + snakeCount + portalCount;
      const freeCells = GRID_SIZE * GRID_SIZE - occupied;
      expect(freeCells).toBeGreaterThanOrEqual(data.foodRequired);
    }
  });
});

describe('spawn center safety', () => {
  it('no layout tile at grid position (10, 10)', () => {
    for (let i = 1; i <= 10; i++) {
      const obstacles = generateObstacles(i);
      for (const obs of obstacles) {
        expect(obs.x === 10 && obs.y === 10).toBe(false);
      }
    }
  });
});
