import type { Position, Food } from './types';
import { RUNNER_LANE_X, GRID_SIZE } from './constants';
import { spawnFood } from './food';

export function generateRunnerCourse(
  headY: number,
  snake: Position[],
  distance: number
): { obstacles: Position[]; food: Food } {
  const difficulty = Math.min(1, distance / 500);
  const numPatterns = 6 + Math.floor(difficulty * 6);

  const obstacles: Position[] = [];
  const rowStep = Math.floor(GRID_SIZE / numPatterns);

  for (let i = 0; i < numPatterns; i++) {
    const y = i * rowStep;
    if (Math.abs(y - headY) < 3) continue;

    const blockedLanes = selectBlockedLanes(difficulty);
    for (const lane of blockedLanes) {
      obstacles.push({ x: RUNNER_LANE_X[lane], y });
    }
  }

  const food = spawnFood(snake, obstacles, [], 'normal');
  return { obstacles, food };
}

function selectBlockedLanes(difficulty: number): number[] {
  const r = Math.random();
  if (r < 0.3 + difficulty * 0.2) {
    const lanes = [0, 1, 2];
    lanes.splice(Math.floor(Math.random() * 3), 1);
    return lanes;
  }
  return [Math.floor(Math.random() * 3)];
}
