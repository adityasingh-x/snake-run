import type { Position } from './types';
import { GRID_SIZE } from './constants';

export function spawnFood(snake: Position[], obstacles: Position[] = []): Position {
  const maxAttempts = GRID_SIZE * GRID_SIZE;
  const occupied = new Set([
    ...snake.map(p => `${p.x},${p.y}`),
    ...obstacles.map(p => `${p.x},${p.y}`),
  ]);

  if (occupied.size >= GRID_SIZE * GRID_SIZE) {
    return snake[0] ?? { x: 0, y: 0 };
  }

  let food: Position;
  let attempts = 0;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    attempts++;
  } while (occupied.has(`${food.x},${food.y}`) && attempts < maxAttempts);

  return occupied.has(`${food.x},${food.y}`) ? (snake[0] ?? { x: 0, y: 0 }) : food;
}
