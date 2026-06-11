export type {
  Position,
  Direction,
  GameStatus,
  Level,
  GameState,
  GameAction,
  FoodType,
  Food,
} from './types';

export {
  GRID_SIZE,
  POINTS_PER_FOOD,
  LEVEL_COUNT,
  INITIAL_SNAKE,
  DIRECTION_OPPOSITE,
  KEY_MAP,
  RUNNER_LANE_X,
  RUNNER_VIEWPORT_TAIL,
} from './constants';

export {
  positionsEqual,
  isWallCollision,
  isObstacleCollision,
  isSelfCollision,
  isCollision,
} from './collision';

export { spawnFood } from './food';
export { calculateNewHead } from './snake';
export { default as LEVELS, getLevelData, generateObstacles, getPortalPositions } from './levels';
export { loadHighScore, saveHighScore, loadLastUnlockedLevel, saveLastUnlockedLevel } from './storage';
export { getInitialState, gameReducer } from './state';
export { Engine } from './Engine';
export type { GameEventListener } from './Engine';
export type { Stats } from './statistics';
export { loadStats, saveStats, incrementGamesPlayed, incrementTotalFood, updateBestLevel } from './statistics';
export type { Achievement } from './achievements';
export { ACHIEVEMENTS, loadAchievements, saveAchievement } from './achievements';
export { getReachableCount, countFreeCells } from './reachability';
