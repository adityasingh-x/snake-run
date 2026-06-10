import type { GameState, GameAction } from './types';
import { INITIAL_SNAKE, POINTS_PER_FOOD, DIRECTION_OPPOSITE, LEVEL_COUNT, GRID_SIZE } from './constants';
import { positionsEqual, isCollision } from './collision';
import { spawnFood } from './food';
import { calculateNewHead } from './snake';
import { loadHighScore, loadLastUnlockedLevel } from './storage';
import { getLevelData, generateObstacles, getPortalPositions } from './levels';

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
    foodEaten: 0,
    isEndless: false,
    speedEffectTicks: 0,
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
      if (state.status !== 'playing') {
        return state;
      }
      if (action.payload === DIRECTION_OPPOSITE[state.direction]) {
        return state;
      }
      return { ...state, nextDirection: action.payload };
    }

    case 'MOVE_SNAKE': {
      const head = state.snake[0];
      let newHead = calculateNewHead(head, state.nextDirection);

      // Wrap-around (Phase 2)
      const levelData = getLevelData(state.level);
      if (levelData.wrapAround) {
        newHead = {
          x: ((newHead.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
          y: ((newHead.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
        };
      }

      // Portal teleport (Phase 3)
      if (levelData.portals) {
        for (const [a, b] of levelData.portals) {
          if (positionsEqual(newHead, a)) { newHead = { ...b }; break; }
          if (positionsEqual(newHead, b)) { newHead = { ...a }; break; }
        }
      }

      if (isCollision(newHead, state.snake, state.obstacles, levelData.wrapAround)) {
        return markGameOver(state);
      }

      const ateFood = positionsEqual(newHead, state.food.position);

      // Decrement food timer (skip when food is being eaten on this tick;
      // the ateFood branch below spawns the replacement, and we don't want
      // a double-spawn or a timer mutation on the just-consumed food.)
      let currentFood = state.food;
      if (currentFood.timer > 0 && !ateFood) {
        const newTimer = currentFood.timer - 1;
        if (newTimer === 0) {
          // Spawn replacement normal food
          const portals = getPortalPositions(state.level);
          const normalFood = spawnFood(state.snake, state.obstacles, portals);
          currentFood = { ...normalFood, type: 'normal', timer: -1 };
        } else {
          currentFood = { ...currentFood, timer: newTimer };
        }
      }

      // Decrement speed effect ticks
      const newSpeedEffectTicks = state.speedEffectTicks > 0 ? state.speedEffectTicks - 1 : 0;

      let newSnake = ateFood
        ? [newHead, ...state.snake]
        : [newHead, ...state.snake.slice(0, -1)];
      let newScore = state.score;
      let newFoodEaten = state.foodEaten;
      let finalFood = currentFood;
      let finalSpeedEffectTicks = newSpeedEffectTicks;

      if (ateFood) {
        newFoodEaten += 1;
        const foodType = state.food.type;
        switch (foodType) {
          case 'normal':
            newScore += POINTS_PER_FOOD;
            break;
          case 'gold':
            newScore += 30;
            break;
          case 'poison': {
            const minLength = INITIAL_SNAKE.length;
            if (newSnake.length > minLength) {
              newSnake = newSnake.slice(0, -1);
            }
            break;
          }
          case 'slow':
            newScore += POINTS_PER_FOOD;
            // Prevent slow-food chain exploit: only refresh the effect if
            // it has already expired. This stops a player from indefinitely
            // chaining slow foods to keep the snake locked at the slowest
            // speed regardless of the current level.
            if (state.speedEffectTicks <= 0) {
              finalSpeedEffectTicks = 10;
            }
            break;
        }

        const portals = getPortalPositions(state.level);
        finalFood = spawnFood(newSnake, state.obstacles, portals);
      }

      const currentConfig = getLevelData(state.level);
      const shouldLevelUp = !state.isEndless && ateFood && newFoodEaten >= currentConfig.foodRequired;

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
            foodEaten: newFoodEaten,
            speedEffectTicks: finalSpeedEffectTicks,
            food: finalFood,
          };
        }

        return {
          ...state,
          snake: newSnake,
          food: finalFood,
          score: newScore,
          direction: state.nextDirection,
          status: 'levelComplete',
          lastUnlockedLevel: Math.max(state.lastUnlockedLevel, state.level + 1),
          foodEaten: newFoodEaten,
          speedEffectTicks: finalSpeedEffectTicks,
        };
      }

      return {
        ...state,
        snake: newSnake,
        food: finalFood,
        score: newScore,
        direction: state.nextDirection,
        foodEaten: newFoodEaten,
        speedEffectTicks: finalSpeedEffectTicks,
      };
    }

    case 'CONTINUE_GAME': {
      if (state.status !== 'levelComplete') {
        return state;
      }

      const nextLevel = state.level + 1;
      const nextObstacles = generateObstacles(nextLevel);
      const nextPortals = getPortalPositions(nextLevel);
      const nextFood = spawnFood(INITIAL_SNAKE, nextObstacles, nextPortals);

      return {
        ...state,
        snake: [...INITIAL_SNAKE],
        food: nextFood,
        level: nextLevel,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'playing',
        obstacles: nextObstacles,
        foodEaten: 0,
        speedEffectTicks: 0,
      };
    }

    case 'START_AT_LEVEL': {
      const level = Math.min(Math.max(1, action.payload), LEVEL_COUNT);
      const obstacles = generateObstacles(level);
      const startPortals = getPortalPositions(level);
      const food = spawnFood(INITIAL_SNAKE, obstacles, startPortals);
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
        foodEaten: 0,
        speedEffectTicks: 0,
      };
    }

    case 'START_ENDLESS_GAME': {
      const level10Obstacles = generateObstacles(LEVEL_COUNT);
      const endlessFood = spawnFood(INITIAL_SNAKE, level10Obstacles);
      return {
        ...state,
        snake: [...INITIAL_SNAKE],
        food: endlessFood,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'playing',
        level: LEVEL_COUNT,
        obstacles: level10Obstacles,
        foodEaten: 0,
        isEndless: true,
        speedEffectTicks: 0,
      };
    }

    default:
      return state;
  }
}
