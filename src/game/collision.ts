import type { Position } from './types';
import { GRID_SIZE } from './constants';

export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isWallCollision(pos: Position, wrapAround: boolean = false): boolean {
  if (wrapAround) return false;
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
}

export function isObstacleCollision(pos: Position, obstacles: Position[]): boolean {
  return obstacles.some(obs => obs.x === pos.x && obs.y === pos.y);
}

export function isSelfCollision(head: Position, snake: Position[]): boolean {
  return snake.slice(0, -1).some(segment => positionsEqual(head, segment));
}

export function isCollision(head: Position, snake: Position[], obstacles: Position[], wrapAround: boolean = false): boolean {
  return isWallCollision(head, wrapAround) || isSelfCollision(head, snake) || isObstacleCollision(head, obstacles);
}
