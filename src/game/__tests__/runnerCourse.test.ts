import { describe, it, expect } from 'vitest';
import { spawnRunnerFood, generateRunnerCourse } from '../runnerCourse';
import { RUNNER_LANE_X, GRID_SIZE } from '../constants';

describe('spawnRunnerFood', () => {
  it('always spawns food on a lane column (x in RUNNER_LANE_X)', () => {
    for (let i = 0; i < 100; i++) {
      const food = spawnRunnerFood([], [], 10, 1);
      expect(RUNNER_LANE_X).toContain(food.position.x);
    }
  });
});

describe('generateRunnerCourse', () => {
  function makeSnake(length: number, lane: 0 | 1 | 2): { x: number; y: number }[] {
    const snake: { x: number; y: number }[] = [];
    const x = RUNNER_LANE_X[lane];
    for (let i = 0; i < length; i++) {
      snake.push({ x, y: 10 + i });
    }
    return snake;
  }

  it('does not place obstacles on adjacent rows', () => {
    const snake = makeSnake(3, 1);
    const { obstacles } = generateRunnerCourse(10, snake, 0, 1);
    const rows = [...new Set(obstacles.map(o => o.y))].sort((a, b) => a - b);
    for (let i = 1; i < rows.length; i++) {
      const gap = rows[i] - rows[i - 1];
      expect(gap).toBeGreaterThanOrEqual(2);
    }
  });

  it('does not place obstacles out of grid bounds', () => {
    const snake = makeSnake(3, 1);
    for (let d = 0; d <= 500; d += 50) {
      const { obstacles } = generateRunnerCourse(10, snake, d, 1);
      for (const o of obstacles) {
        expect(o.y).toBeGreaterThanOrEqual(0);
        expect(o.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('has at least one clear lane per obstacle row', () => {
    const snake = makeSnake(3, 1);
    for (let d = 0; d <= 500; d += 50) {
      const { obstacles } = generateRunnerCourse(10, snake, d, 1);
      const rows = new Set(obstacles.map(o => o.y));
      for (const row of rows) {
        const blockedLanes = obstacles
          .filter(o => o.y === row)
          .map(o => RUNNER_LANE_X.indexOf(o.x));
        expect(blockedLanes.length).toBeLessThan(3);
      }
    }
  });

  it('spacing is at least MIN_PATTERN_SPACING at max difficulty', () => {
    const snake = makeSnake(3, 1);
    const { obstacles } = generateRunnerCourse(10, snake, 500, 1);
    const rows = [...new Set(obstacles.map(o => o.y))].sort((a, b) => a - b);
    expect(rows.length).toBeLessThanOrEqual(10);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i] - rows[i - 1]).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('risk-aware food placement', () => {
  function makeSnake(length: number, lane: 0 | 1 | 2): { x: number; y: number }[] {
    const snake: { x: number; y: number }[] = [];
    const x = RUNNER_LANE_X[lane];
    for (let i = 0; i < length; i++) {
      snake.push({ x, y: 10 + i });
    }
    return snake;
  }

  it('food never spawns within 3 rows of head Y', () => {
    for (let i = 0; i < 50; i++) {
      const snake = makeSnake(3, 1);
      const { food } = generateRunnerCourse(10, snake, 0, 1);
      expect(Math.abs(food.position.y - 10)).toBeGreaterThanOrEqual(3);
    }
  });

  it('at tier 1 (length 3-9), food spawns on a row with 0 obstacles in current or adjacent lane', () => {
    for (let i = 0; i < 30; i++) {
      const snake = makeSnake(5, 1);
      const { obstacles, food } = generateRunnerCourse(10, snake, 0, 1);
      const rowObstacles = obstacles.filter(o => o.y === food.position.y);
      // At tier 1, food should be on a safe row (0 obstacles on that row)
      expect(rowObstacles.length).toBe(0);
    }
  });

  it('at tier 3 (length 20), food may be on rows with 1 obstacle and in a different lane', () => {
    // Since placement is random, verify that when food IS on a 1-obstacle row,
    // it is in a clear lane (not the blocked one)
    let foundMediumFood = false;
    for (let i = 0; i < 50; i++) {
      const snake = makeSnake(20, 1);
      const { obstacles, food } = generateRunnerCourse(10, snake, 0, 1);
      const rowObstacles = obstacles.filter(o => o.y === food.position.y);
      if (rowObstacles.length === 1) {
        foundMediumFood = true;
        // Food must not be on the obstacle position
        expect(food.position.x).not.toBe(rowObstacles[0].x);
        // Food position must still be a valid lane
        expect(RUNNER_LANE_X).toContain(food.position.x);
      }
      // All placements should be valid
      expect(RUNNER_LANE_X).toContain(food.position.x);
    }
    // With 50 iterations at tier 3, we should see medium rows at least sometimes
    // (this is probabilistic but with bias toward medium at tier 3 it should pass)
    expect(foundMediumFood).toBe(true);
  });

  it('food is always on a clear lane (not blocked by an obstacle)', () => {
    for (let i = 0; i < 100; i++) {
      const snake = makeSnake(3 + Math.floor(Math.random() * 50), 1);
      const { obstacles, food } = generateRunnerCourse(10, snake, 0, 1);
      const blockedAtFood = obstacles.some(
        o => o.x === food.position.x && o.y === food.position.y,
      );
      expect(blockedAtFood).toBe(false);
    }
  });

  it('food position is never within the snake body', () => {
    for (let i = 0; i < 50; i++) {
      const length = 3 + Math.floor(Math.random() * 50);
      const snake = makeSnake(length, 1);
      const { food } = generateRunnerCourse(10, snake, 0, 1);
      const foodOnSnake = snake.some(
        s => s.x === food.position.x && s.y === food.position.y,
      );
      expect(foodOnSnake).toBe(false);
    }
  });

  it('tier 5 (length 50+) can place food on rows with 2 obstacles', () => {
    let foundHighRiskFood = false;
    for (let i = 0; i < 100; i++) {
      const snake = makeSnake(50, 1);
      const { obstacles, food } = generateRunnerCourse(10, snake, 0, 1);
      const rowObstacles = obstacles.filter(o => o.y === food.position.y);
      if (rowObstacles.length === 2) {
        foundHighRiskFood = true;
        // Food must be on the one clear lane
        const blockedLanes = rowObstacles.map(o => RUNNER_LANE_X.indexOf(o.x));
        const allLanes = [0, 1, 2];
        const clearLane = allLanes.find(l => !blockedLanes.includes(l));
        expect(clearLane).toBeDefined();
        expect(food.position.x).toBe(RUNNER_LANE_X[clearLane!]);
      }
    }
    // At tier 5 with 100 iterations, we should see some high-risk placements
    expect(foundHighRiskFood).toBe(true);
  });

  it('food placement at tier 2 forces lane change from player position', () => {
    // At tier 2 with a 3-lane snake, verify that food sometimes
    // requires a lane change from currentLane=1
    let foundLaneChangeRequired = false;
    for (let i = 0; i < 50; i++) {
      const snake = makeSnake(12, 1);
      const { food } = generateRunnerCourse(10, snake, 0, 1);
      const foodLane = RUNNER_LANE_X.indexOf(food.position.x);
      if (foodLane !== 1) {
        foundLaneChangeRequired = true;
      }
    }
    // Tier 2 should sometimes require lane changes
    expect(foundLaneChangeRequired).toBe(true);
  });

  it('tier 4 (length 30-49) prefers far lanes from center', () => {
    // From center (lane 1), tier 4 prefers both edges (0, 2).
    // Same-lane placements only occur when edges are both blocked
    // (e.g. 2-obstacle row where only lane 1 is clear).
    let sameLaneCount = 0;
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      const snake = makeSnake(40, 1);
      const { food } = generateRunnerCourse(10, snake, 0, 1);
      const foodLane = RUNNER_LANE_X.indexOf(food.position.x);
      if (foodLane === 1) {
        sameLaneCount++;
      }
    }
    expect(sameLaneCount).toBeLessThan(iterations * 0.3);
  });

  it('tier 4 (length 30-49) prefers opposite edge from side lane', () => {
    // From left edge (lane 0), tier 4 prefers the opposite edge (lane 2).
    // Lane 0 same-lane placements should be rare.
    let sameLaneCount = 0;
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      const snake = makeSnake(40, 0);
      const { food } = generateRunnerCourse(10, snake, 0, 0);
      const foodLane = RUNNER_LANE_X.indexOf(food.position.x);
      if (foodLane === 0) {
        sameLaneCount++;
      }
    }
    expect(sameLaneCount).toBeLessThan(iterations * 0.3);
  });
});
