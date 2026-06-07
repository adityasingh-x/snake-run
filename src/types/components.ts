import type { Position, Direction } from './game';
import type { Achievement } from '../game/achievements';
import type { Stats } from '../game/statistics';

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
  foodEaten: number;
  foodRequired: number;
  isEndless?: boolean;
}

export interface GameOverProps {
  score: number;
  onRestart: () => void;
  onContinueFromLevel: (level: number) => void;
  lastUnlockedLevel: number;
  variant?: 'gameover' | 'win';
  isEndless?: boolean;
  onStartEndless?: () => void;
  stats?: Stats;
  achievements?: Achievement[];
  newAchievementIds?: string[];
}

export interface LevelTransitionProps {
  completedLevelId: number;
  completedLevelName: string;
  nextLevelName: string;
  nextLevelDescription: string;
  score: number;
  onContinue: () => void;
}

export interface StatisticsProps {
  gamesPlayed: number;
  totalFood: number;
  bestLevel: number;
  highScore: number;
}
