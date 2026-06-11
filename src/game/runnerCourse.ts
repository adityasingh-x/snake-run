import type { Position, Food } from './types';
import { RUNNER_LANE_X, GRID_SIZE } from './constants';

export function generateRunnerCourse(
  headY: number,
  snake: Position[],
  distance: number
): { obstacles: Position[]; food: Food } {
  const difficulty = Math.min(1, distance / 500);
  const numPatterns = 6 + Math.floor(difficulty * 6);

  const obstacles: Position[] = [];
  const MIN_PATTERN_SPACING = 2;
  const rowStep = Math.max(MIN_PATTERN_SPACING, Math.floor(GRID_SIZE / numPatterns));

  for (let i = 0; i < numPatterns; i++) {
    const y = i * rowStep;
    if (y >= GRID_SIZE) continue;
    if (Math.abs(y - headY) < 3) continue;

    const blockedLanes = selectBlockedLanes(difficulty);
    for (const lane of blockedLanes) {
      obstacles.push({ x: RUNNER_LANE_X[lane], y });
    }
  }

  const food = spawnRunnerFood(snake, obstacles, headY);
  return { obstacles, food };
}

export function spawnRunnerFood(
  snake: Position[],
  obstacles: Position[],
  headY: number
): Food {
  const occupied = new Set<string>();
  for (const s of snake) occupied.add(`${s.x},${s.y}`);
  for (const o of obstacles) occupied.add(`${o.x},${o.y}`);

  const candidates: Position[] = [];
  for (const lane of [0, 1, 2]) {
    const x = RUNNER_LANE_X[lane];
    for (let y = 0; y < GRID_SIZE; y++) {
      if (Math.abs(y - headY) < 3) continue;
      if (!occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }

  const pos = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : { x: RUNNER_LANE_X[1], y: 10 };

  return { position: pos, type: 'normal', timer: -1 };
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
