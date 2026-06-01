import type { Level, Position } from '../types/game';
import { GRID_SIZE } from './constants';

const LEVELS: Level[] = [];
for (let i = 1; i <= 10; i++) {
  LEVELS.push({
    id: i,
    targetScore: i * 50,
    speed: 150 - (i - 1) * 10,
  });
}

export default LEVELS;

export function getLevelData(levelId: number) {
  const data = LEVELS[levelId - 1];
  if (!data) {
    throw new Error(`Invalid level ID: ${levelId}. Must be between 1 and 10.`);
  }
  return data;
}

export function generateObstacles(
  levelId: number,
  snake: Position[],
  food: Position,
): Position[] {
  const count = Math.min(Math.max(1, Math.floor(levelId * 0.5)), 8);
  const occupied = new Set([
    ...snake.map(p => `${p.x},${p.y}`),
    `${food.x},${food.y}`,
  ]);
  const obstacles: Position[] = [];

  for (let i = 0; i < count * 10 && obstacles.length < count; i++) {
    const pos: Position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    const key = `${pos.x},${pos.y}`;
    if (!occupied.has(key)) {
      obstacles.push(pos);
      occupied.add(key);
    }
  }
  return obstacles;
}
