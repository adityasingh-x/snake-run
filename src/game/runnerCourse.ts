import type { Position, Food } from './types';
import { RUNNER_LANE_X, GRID_SIZE } from './constants';
import { getMultiplier } from './snake';

export function generateRunnerCourse(
  headY: number,
  snake: Position[],
  distance: number,
  currentLane: 0 | 1 | 2,
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

  const food = spawnRunnerFood(snake, obstacles, headY, currentLane);
  return { obstacles, food };
}

export function spawnRunnerFood(
  snake: Position[],
  obstacles: Position[],
  headY: number,
  currentLane: 0 | 1 | 2,
): Food {
  const snakeSet = new Set<string>();
  for (const s of snake) snakeSet.add(`${s.x},${s.y}`);

  const obstacleMap = new Map<number, Set<number>>();
  for (const o of obstacles) {
    if (!obstacleMap.has(o.y)) obstacleMap.set(o.y, new Set());
    obstacleMap.get(o.y)!.add(o.x);
  }

  const safeRows: number[] = [];
  const mediumRows: number[] = [];
  const highRows: number[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    if (Math.abs(y - headY) < 3) continue;
    const obstacleCount = obstacleMap.get(y)?.size ?? 0;
    if (obstacleCount === 0) safeRows.push(y);
    else if (obstacleCount === 1) mediumRows.push(y);
    else if (obstacleCount === 2) highRows.push(y);
  }

  const tier = getMultiplier(snake.length);
  let targetY: number | null = null;

  const pickRandom = (arr: number[]): number | null =>
    arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

  switch (tier) {
    case 1:
      targetY = pickRandom(safeRows);
      break;
    case 2:
      targetY = Math.random() < 0.7 ? pickRandom(safeRows) : pickRandom(mediumRows);
      if (targetY === null) targetY = pickRandom(safeRows);
      break;
    case 3: {
      const candidates = mediumRows.length > 0 ? mediumRows : safeRows;
      targetY = pickRandom(candidates);
      break;
    }
    case 4: {
      const candidates = [...mediumRows, ...highRows];
      if (candidates.length > 0) {
        targetY = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        targetY = pickRandom(safeRows);
      }
      break;
    }
    case 5:
      targetY = Math.random() < 0.8 ? pickRandom(highRows) : pickRandom(mediumRows);
      if (targetY === null) targetY = pickRandom(mediumRows) ?? pickRandom(safeRows);
      break;
  }

  if (targetY === null) targetY = safeRows[0] ?? mediumRows[0] ?? highRows[0] ?? 10;

  const foodLane = pickFoodLane(targetY, currentLane, tier, obstacleMap);
  const foodX = RUNNER_LANE_X[foodLane];

  // Verify the food lane is not blocked by an obstacle
  const rowBlockers = obstacleMap.get(targetY);
  const key = `${foodX},${targetY}`;

  // Try food lane first; fall back to other clear lanes on same row
  const laneBlocked = rowBlockers && rowBlockers.has(foodX);
  const snakeOverlap = snakeSet.has(key);

  if (!laneBlocked && !snakeOverlap) {
    return { position: { x: foodX, y: targetY }, type: 'normal', timer: -1 };
  }

  // Try other lanes on the same row
  for (const ln of [0, 1, 2] as const) {
    const lx = RUNNER_LANE_X[ln];
    if (snakeSet.has(`${lx},${targetY}`)) continue;
    if (rowBlockers && rowBlockers.has(lx)) continue;
    return { position: { x: lx, y: targetY }, type: 'normal', timer: -1 };
  }

  // Fallback: any safe row (0 obstacles) with a clear lane not on snake
  for (const y of safeRows) {
    for (const ln of [0, 1, 2] as const) {
      const lx = RUNNER_LANE_X[ln];
      if (snakeSet.has(`${lx},${y}`)) continue;
      const blockersAtY = obstacleMap.get(y);
      if (blockersAtY && blockersAtY.has(lx)) continue;
      return { position: { x: lx, y }, type: 'normal', timer: -1 };
    }
  }

  // Ultimate fallback
  return { position: { x: RUNNER_LANE_X[1], y: 10 }, type: 'normal', timer: -1 };
}

function pickFoodLane(
  targetY: number,
  currentLane: 0 | 1 | 2,
  tier: number,
  obstacleMap: Map<number, Set<number>>,
): 0 | 1 | 2 {
  const rowBlockers = obstacleMap.get(targetY);
  const clearLanes: (0 | 1 | 2)[] = [];
  for (const ln of [0, 1, 2] as const) {
    if (!rowBlockers || !rowBlockers.has(RUNNER_LANE_X[ln])) {
      clearLanes.push(ln);
    }
  }

  if (clearLanes.length === 0) return 1;

  switch (tier) {
    case 1:
      // Prefer current lane, fallback to adjacent
      if (clearLanes.includes(currentLane)) return currentLane;
      return clearLanes[Math.floor(Math.random() * clearLanes.length)];

    case 2:
      // May require lane change from current
      if (clearLanes.length === 1) return clearLanes[0];
      if (clearLanes.includes(currentLane) && Math.random() < 0.5) return currentLane;
      // Pick a lane different from current if possible
      {
        const diffLanes = clearLanes.filter(l => l !== currentLane);
        if (diffLanes.length > 0) return diffLanes[Math.floor(Math.random() * diffLanes.length)];
        return clearLanes[0];
      }

    case 3:
      // Different lane from player preferred
      {
        const diffLanes = clearLanes.filter(l => l !== currentLane);
        if (diffLanes.length > 0) return diffLanes[Math.floor(Math.random() * diffLanes.length)];
        return clearLanes[0];
      }

    case 4: {
      // Prefer lanes far from current: from center (1) → both edges (0,2); from edge → opposite edge
      const farLanes = clearLanes.filter(l => {
        if (currentLane === 1) return l !== 1;
        return l !== currentLane && l !== 1;
      });
      if (farLanes.length > 0) return farLanes[Math.floor(Math.random() * farLanes.length)];
      return clearLanes[Math.floor(Math.random() * clearLanes.length)];
    }
    case 5:
      return clearLanes[Math.floor(Math.random() * clearLanes.length)];

    default:
      return clearLanes[0];
  }
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
