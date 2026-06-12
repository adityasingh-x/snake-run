import type { Position, Direction } from './types';

export const MILESTONES = [10, 20, 30, 50];

export function getMultiplier(length: number): number {
  if (length >= 50) return 5;
  if (length >= 30) return 4;
  if (length >= 20) return 3;
  if (length >= 10) return 2;
  return 1;
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
  }
}
