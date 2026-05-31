import type { Position, Direction } from '../types/game';
import { GRID_SIZE } from './constants';

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function calculateNewHead(head: Position, direction: Direction): Position {
  switch (direction) {
    case 'UP':
      return { x: head.x, y: head.y - 1 };
    case 'DOWN':
      return { x: head.x, y: head.y + 1 };
    case 'LEFT':
      return { x: head.x - 1, y: head.y };
    case 'RIGHT':
      return { x: head.x + 1, y: head.y };
    default:
      return head;
  }
}

export function isWallCollision(pos: Position): boolean {
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
}

export function isObstacleCollision(pos: Position, obstacles: { x: number; y: number }[]): boolean {
  return obstacles.some(obs => obs.x === pos.x && obs.y === pos.y);
}

export function isSelfCollision(head: Position, snake: Position[]): boolean {
  return snake.slice(0, -1).some(segment => positionsEqual(head, segment));
}

export function isCollision(head: Position, snake: Position[], obstacles: { x: number; y: number }[]): boolean {
  return isWallCollision(head) || isSelfCollision(head, snake) || isObstacleCollision(head, obstacles);
}

export function spawnFood(snake: Position[], obstacles: { x: number; y: number }[] = []): Position {
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
