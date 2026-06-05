import type { Position, Direction } from './game';

export interface BoardProps {
  snake: Position[];
  direction: Direction;
  food: Position;
  obstacles: Position[];
}

export interface CellProps {
  x: number;
  y: number;
  isSnakeHead: boolean;
  isSnakeBody: boolean;
  isFood: boolean;
  isObstacle: boolean;
  direction?: Direction;
}

export interface ScoreBoardProps {
  score: number;
  highScore: number;
  level: number;
  levelName?: string;
}

export interface GameOverProps {
  score: number;
  onRestart: () => void;
  variant?: 'gameover' | 'win';
}

export interface LevelTransitionProps {
  completedLevelId: number;
  completedLevelName: string;
  nextLevelName: string;
  nextLevelDescription: string;
  score: number;
  onContinue: () => void;
}
