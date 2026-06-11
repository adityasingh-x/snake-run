import type { Position, Food, FoodType } from './types';
import { GRID_SIZE } from './constants';

export const FOOD_SPAWN_WEIGHTS: Record<FoodType, number> = { normal: 80, gold: 10, poison: 5, slow: 5 };
export const FOOD_TIMERS: Record<FoodType, number> = { normal: -1, gold: 10, poison: -1, slow: 8 };

function rollFoodType(): FoodType {
  const total = Object.values(FOOD_SPAWN_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [type, weight] of Object.entries(FOOD_SPAWN_WEIGHTS)) {
    r -= weight;
    if (r <= 0) return type as FoodType;
  }
  return 'normal';
}

export function spawnFood(snake: Position[], obstacles: Position[] = [], portals: Position[] = [], forceType?: FoodType): Food {
  const maxAttempts = GRID_SIZE * GRID_SIZE;
  const occupied = new Set([
    ...snake.map(p => `${p.x},${p.y}`),
    ...obstacles.map(p => `${p.x},${p.y}`),
    ...portals.map(p => `${p.x},${p.y}`),
  ]);

  if (occupied.size >= GRID_SIZE * GRID_SIZE) {
    return { position: snake[0] ?? { x: 0, y: 0 }, type: 'normal', timer: -1 };
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

  const position = occupied.has(`${food.x},${food.y}`) ? (snake[0] ?? { x: 0, y: 0 }) : food;
  const type = forceType ?? rollFoodType();
  return { position, type, timer: FOOD_TIMERS[type] };
}
