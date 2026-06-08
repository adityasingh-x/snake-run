import type { Position } from './types';
import { GRID_SIZE } from './constants';

export function getReachableCount(
  snakeHead: Position,
  obstacles: Position[],
  portals?: [Position, Position][],
  wrapAround?: boolean,
  gridSize?: number
): number {
  const size = gridSize ?? GRID_SIZE;
  const obstacleSet = new Set(obstacles.map(o => `${o.x},${o.y}`));
  const portalMap = new Map<string, Position>();
  if (portals) {
    for (const [entry, exit] of portals) {
      portalMap.set(`${entry.x},${entry.y}`, exit);
    }
  }

  const visited = new Set<string>();
  const queue: Position[] = [snakeHead];
  visited.add(`${snakeHead.x},${snakeHead.y}`);

  // 4-directional movement (up, down, left, right)
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    // Portal teleport: if current cell is a portal entry, explore from the exit
    const portalExit = portalMap.get(key);
    if (portalExit) {
      const exitKey = `${portalExit.x},${portalExit.y}`;
      if (!visited.has(exitKey) && !obstacleSet.has(exitKey)) {
        visited.add(exitKey);
        queue.push({ ...portalExit });
      }
    }

    for (const { dx, dy } of dirs) {
      let nx = current.x + dx;
      let ny = current.y + dy;

      // Wrap-around: normalize coordinates using modulo (handles negative values)
      if (wrapAround) {
        nx = (nx + size) % size;
        ny = (ny + size) % size;
      } else {
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      }

      const nKey = `${nx},${ny}`;
      if (!visited.has(nKey) && !obstacleSet.has(nKey)) {
        visited.add(nKey);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return visited.size;
}

export function countFreeCells(
  obstacleCount: number,
  portalCount?: number,
  gridSize?: number
): number {
  const size = gridSize ?? GRID_SIZE;
  const pc = portalCount ?? 0;
  return size * size - obstacleCount - pc;
}
