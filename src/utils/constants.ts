import type { Position, Direction } from '../types/game';

export const GRID_SIZE = Number(import.meta.env.VITE_GRID_SIZE) || 20;
export const CELL_SIZE = Number(import.meta.env.VITE_CELL_SIZE) || 20;
export const POINTS_PER_FOOD = Number(import.meta.env.VITE_POINTS_PER_FOOD) || 10;
export const LEVEL_COUNT = Number(import.meta.env.VITE_LEVEL_COUNT) || 10;

export const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export const DIRECTION_OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT',
  W: 'UP',
  S: 'DOWN',
  A: 'LEFT',
  D: 'RIGHT',
};
