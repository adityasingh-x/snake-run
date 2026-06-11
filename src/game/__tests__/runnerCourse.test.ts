import { describe, it, expect } from 'vitest';
import { spawnRunnerFood } from '../runnerCourse';
import { RUNNER_LANE_X } from '../constants';

describe('spawnRunnerFood', () => {
  it('always spawns food on a lane column (x in RUNNER_LANE_X)', () => {
    for (let i = 0; i < 100; i++) {
      const food = spawnRunnerFood([], [], 10);
      expect(RUNNER_LANE_X).toContain(food.position.x);
    }
  });
});
