import type { GameState, GameAction } from './types';
import { INITIAL_SNAKE, POINTS_PER_FOOD, DIRECTION_OPPOSITE } from './constants';
import { positionsEqual, isCollision } from './collision';
import { spawnFood } from './food';
import { calculateNewHead } from './snake';
import { loadHighScore } from './storage';
import { getLevelData, generateObstacles } from './levels';

export function getInitialState(): GameState {
  const obstacles = generateObstacles(1, INITIAL_SNAKE, { x: 0, y: 0 });
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
  };
}

function markGameOver(state: GameState): GameState {
  return {
    ...state,
    status: 'gameover',
    highScore: Math.max(state.highScore, state.score),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
    case 'RESET': {
      return { ...getInitialState(), status: 'playing' };
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
        if (state.level >= 10) {
          return {
            ...state,
            snake: newSnake,
            score: newScore,
            direction: state.nextDirection,
            status: 'won',
            highScore: Math.max(state.highScore, newScore),
          };
        }

        const nextLevel = state.level + 1;
        const nextObstacles = generateObstacles(nextLevel, INITIAL_SNAKE, { x: 0, y: 0 });
        const nextFood = spawnFood(INITIAL_SNAKE, nextObstacles);
        return {
          ...state,
          snake: [...INITIAL_SNAKE],
          food: nextFood,
          score: newScore,
          level: nextLevel,
          direction: 'RIGHT',
          nextDirection: 'RIGHT',
          status: 'playing',
          obstacles: nextObstacles,
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

    default:
      return state;
  }
}
