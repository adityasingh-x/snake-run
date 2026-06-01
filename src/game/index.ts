export type {
  Position,
  Direction,
  GameStatus,
  Level,
  GameState,
  GameAction,
} from './types';

export {
  GRID_SIZE,
  CELL_SIZE,
  POINTS_PER_FOOD,
  LEVEL_COUNT,
  INITIAL_SNAKE,
  DIRECTION_OPPOSITE,
  KEY_MAP,
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
export { default as LEVELS, getLevelData, generateObstacles } from './levels';
export { loadHighScore, saveHighScore } from './storage';
export { getInitialState, gameReducer } from './state';
export { Engine } from './Engine';
export type { GameEventListener } from './Engine';
