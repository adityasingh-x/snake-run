import { describe, it, expect } from 'vitest';
import { getLevelData, generateObstacles, getPortalPositions } from '../levels';
import { getReachableCount, countFreeCells } from '../reachability';
import { GRID_SIZE, INITIAL_SNAKE } from '../constants';
import { isWallCollision } from '../collision';

describe('level-by-level validation', () => {
  for (let levelId = 1; levelId <= 10; levelId++) {
    const data = getLevelData(levelId);
    const obstacles = generateObstacles(levelId);
    const portalPositions = getPortalPositions(levelId);
    const portals = data.portals as [typeof INITIAL_SNAKE[0], typeof INITIAL_SNAKE[0]][] | undefined;

    describe(`Level ${levelId} (${data.name})`, () => {
      it('spawn is safe', () => {
        const obstacleKeys = new Set(obstacles.map(o => `${o.x},${o.y}`));
        const portalKeys = new Set(portalPositions.map(p => `${p.x},${p.y}`));
        for (const seg of INITIAL_SNAKE) {
          const key = `${seg.x},${seg.y}`;
          expect(obstacleKeys.has(key)).toBe(false);
          expect(portalKeys.has(key)).toBe(false);
          expect(seg.x).toBeGreaterThanOrEqual(0);
          expect(seg.x).toBeLessThan(GRID_SIZE);
          expect(seg.y).toBeGreaterThanOrEqual(0);
          expect(seg.y).toBeLessThan(GRID_SIZE);
        }
      });

      it('obstacles are within bounds [0, GRID_SIZE)', () => {
        for (const obs of obstacles) {
          expect(obs.x).toBeGreaterThanOrEqual(0);
          expect(obs.x).toBeLessThan(GRID_SIZE);
          expect(obs.y).toBeGreaterThanOrEqual(0);
          expect(obs.y).toBeLessThan(GRID_SIZE);
        }
      });

      it('no duplicate obstacle coordinates', () => {
        const keys = obstacles.map(o => `${o.x},${o.y}`);
        expect(new Set(keys).size).toBe(obstacles.length);
      });

      it('first-tick has at least 2 survivable directions', () => {
        const firstTickNeighbors = [
          { x: 11, y: 10 },
          { x: 10, y: 9 },
          { x: 10, y: 11 },
        ];
        const obstacleKeys = new Set(obstacles.map(o => `${o.x},${o.y}`));
        const blocked = firstTickNeighbors.filter(n => obstacleKeys.has(`${n.x},${n.y}`));
        expect(blocked.length).toBeLessThan(2);
      });

      it('has enough free cells for food', () => {
        const portalCount = portalPositions.length;
        const freeCells = countFreeCells(obstacles.length, portalCount);
        expect(freeCells).toBeGreaterThanOrEqual(1);
        expect(freeCells).toBeGreaterThanOrEqual(data.foodRequired);
      });

      it('reachable cells >= required', () => {
        const required = data.foodRequired + INITIAL_SNAKE.length;
        const reachable = getReachableCount(
          INITIAL_SNAKE[0],
          obstacles,
          portals,
          data.wrapAround
        );
        expect(reachable).toBeGreaterThanOrEqual(required);
      });

      it('snake head (10,10) is reachable from itself', () => {
        const reachable = getReachableCount(
          INITIAL_SNAKE[0],
          obstacles,
          portals,
          data.wrapAround
        );
        expect(reachable).toBeGreaterThanOrEqual(1);
      });
    });
  }
});

describe('Level 5 wrap-around specific', () => {
  it('BFS with wrapAround reaches entire board', () => {
    const obstacles = generateObstacles(5);
    const reachableWithWrap = getReachableCount(
      INITIAL_SNAKE[0],
      obstacles,
      undefined,
      true
    );
    expect(reachableWithWrap).toBe(400 - obstacles.length);
  });

  it('wall collision returns false for edge positions with wrapAround', () => {
    expect(isWallCollision({ x: 0, y: 10 }, true)).toBe(false);
    expect(isWallCollision({ x: 19, y: 10 }, true)).toBe(false);
    expect(isWallCollision({ x: 10, y: 0 }, true)).toBe(false);
    expect(isWallCollision({ x: 10, y: 19 }, true)).toBe(false);
  });
});

describe('Level 7 portal specific', () => {
  it('portal entries and exits are safe', () => {
    const obstacles = generateObstacles(7);
    const obstacleKeys = new Set(obstacles.map(o => `${o.x},${o.y}`));
    const snakeKeys = new Set(INITIAL_SNAKE.map(p => `${p.x},${p.y}`));
    const portalPositions = getPortalPositions(7);

    for (const pos of portalPositions) {
      expect(obstacleKeys.has(`${pos.x},${pos.y}`)).toBe(false);
      expect(snakeKeys.has(`${pos.x},${pos.y}`)).toBe(false);
    }
  });

  it('portal entries are distinct from exits', () => {
    const positions = getPortalPositions(7);
    expect(positions[0].x === positions[1].x && positions[0].y === positions[1].y).toBe(false);
  });

  it('BFS with portals reaches both chambers', () => {
    const obstacles = generateObstacles(7);
    const data = getLevelData(7);
    const portals = data.portals as [{ x: number; y: number }, { x: number; y: number }][];
    const reachable = getReachableCount(INITIAL_SNAKE[0], obstacles, portals);
    expect(reachable).toBeGreaterThan(200);
  });
});
