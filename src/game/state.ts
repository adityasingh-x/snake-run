import type { GameState, GameAction } from './types';
import { INITIAL_SNAKE, POINTS_PER_FOOD, DIRECTION_OPPOSITE, LEVEL_COUNT } from './constants';
import { positionsEqual, isCollision } from './collision';
import { spawnFood } from './food';
import { calculateNewHead } from './snake';
import { loadHighScore, loadLastUnlockedLevel } from './storage';
import { getLevelData, generateObstacles } from './levels';

export function getInitialState(): GameState {
  const obstacles = generateObstacles(1);
  const food = spawnFood(INITIAL_SNAKE, obstacles);
  return {
    snake: [...INITIAL_SNAKE],
    food,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    status: 'idle',
    score: 0,
    highScore: loadHighScore(),
    level: 1,
    obstacles,
    lastUnlockedLevel: loadLastUnlockedLevel(),
  };
}

function markGameOver(state: GameState): GameState {
  return {
    ...state,
    status: 'gameover',
    highScore: Math.max(state.highScore, state.score),
    lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
    case 'RESET': {
      const initial = getInitialState();
      return { ...initial, status: 'playing', lastUnlockedLevel: state.lastUnlockedLevel };
    }

    case 'PAUSE_GAME':
      return { ...state, status: 'paused' };

    case 'RESUME_GAME':
      return { ...state, status: 'playing' };

    case 'CHANGE_DIRECTION': {
      if (action.payload === DIRECTION_OPPOSITE[state.direction]) {
        return state;
      }
      return { ...state, nextDirection: action.payload };
    }

    case 'MOVE_SNAKE': {
      const head = state.snake[0];
      const newHead = calculateNewHead(head, state.nextDirection);

      if (isCollision(newHead, state.snake, state.obstacles)) {
        return markGameOver(state);
      }

      const ateFood = positionsEqual(newHead, state.food);
      const newSnake = ateFood
        ? [newHead, ...state.snake]
        : [newHead, ...state.snake.slice(0, -1)];
      const newScore = ateFood ? state.score + POINTS_PER_FOOD : state.score;

      const currentConfig = getLevelData(state.level);
      const shouldLevelUp = ateFood && newScore >= currentConfig.targetScore;

      if (shouldLevelUp) {
        if (state.level >= LEVEL_COUNT) {
          return {
            ...state,
            snake: newSnake,
            score: newScore,
            direction: state.nextDirection,
            status: 'won',
            highScore: Math.max(state.highScore, newScore),
            lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level),
          };
        }

        return {
          ...state,
          snake: newSnake,
          food: spawnFood(newSnake, state.obstacles),
          score: newScore,
          direction: state.nextDirection,
          status: 'levelComplete',
          lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level + 1),
        };
      }

      return {
        ...state,
        snake: newSnake,
        food: ateFood ? spawnFood(newSnake, state.obstacles) : state.food,
        score: newScore,
        direction: state.nextDirection,
      };
    }

    case 'CONTINUE_GAME': {
      if (state.status !== 'levelComplete') {
        return state;
      }

      const nextLevel = state.level + 1;
      const nextObstacles = generateObstacles(nextLevel);
      const nextFood = spawnFood(INITIAL_SNAKE, nextObstacles);

      return {
        ...state,
        snake: [...INITIAL_SNAKE],
        food: nextFood,
        level: nextLevel,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'playing',
        obstacles: nextObstacles,
      };
    }

    case 'START_AT_LEVEL': {
      const level = Math.min(Math.max(1, action.payload), LEVEL_COUNT);
      const obstacles = generateObstacles(level);
      const food = spawnFood(INITIAL_SNAKE, obstacles);
      return {
        ...state,
        snake: [...INITIAL_SNAKE],
        food,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'playing',
        score: 0,
        level,
        obstacles,
      };
    }

    default:
      return state;
  }
}
