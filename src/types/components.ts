import type { Position } from './game';

export interface BoardProps {
  snake: Position[];
  food: Position;
  obstacles: { x: number; y: number }[];
}

export interface CellProps {
  isSnakeHead: boolean;
  isSnakeBody: boolean;
  isFood: boolean;
  isObstacle: boolean;
}

export interface ScoreBoardProps {
  score: number;
  highScore: number;
  level: number;
}

export interface GameOverProps {
  score: number;
  onRestart: () => void;
  variant?: 'gameover' | 'win';
}
