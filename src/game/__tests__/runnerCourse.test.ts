import { describe, it, expect } from 'vitest';
import { spawnRunnerFood, generateRunnerCourse } from '../runnerCourse';
import { RUNNER_LANE_X, GRID_SIZE } from '../constants';

describe('spawnRunnerFood', () => {
  it('always spawns food on a lane column (x in RUNNER_LANE_X)', () => {
    for (let i = 0; i < 100; i++) {
      const food = spawnRunnerFood([], [], 10);
      expect(RUNNER_LANE_X).toContain(food.position.x);
    }
  });
});

describe('generateRunnerCourse', () => {
  it('does not place obstacles on adjacent rows', () => {
    const snake: { x: number; y: number }[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
    ];
    const { obstacles } = generateRunnerCourse(10, snake, 0);
    const rows = [...new Set(obstacles.map(o => o.y))].sort((a, b) => a - b);
    for (let i = 1; i < rows.length; i++) {
      const gap = rows[i] - rows[i - 1];
      expect(gap).toBeGreaterThanOrEqual(2);
    }
  });

  it('does not place obstacles out of grid bounds', () => {
    const snake: { x: number; y: number }[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
    ];
    for (let d = 0; d <= 500; d += 50) {
      const { obstacles } = generateRunnerCourse(10, snake, d);
      for (const o of obstacles) {
        expect(o.y).toBeGreaterThanOrEqual(0);
        expect(o.y).toBeLessThan(GRID_SIZE);
      }
    }
  });

  it('has at least one clear lane per obstacle row', () => {
    const snake: { x: number; y: number }[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
    ];
    for (let d = 0; d <= 500; d += 50) {
      const { obstacles } = generateRunnerCourse(10, snake, d);
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
    const snake: { x: number; y: number }[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
    ];
    // At max difficulty (distance=500), numPatterns=12
    const { obstacles } = generateRunnerCourse(10, snake, 500);
    const rows = [...new Set(obstacles.map(o => o.y))].sort((a, b) => a - b);
    // Should have at most 10 rows (some may be skipped due to bounds/headY proximity)
    expect(rows.length).toBeLessThanOrEqual(10);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i] - rows[i - 1]).toBeGreaterThanOrEqual(2);
    }
  });
});
