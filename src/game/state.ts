import type { GameState, GameAction, Position } from './types';
import { INITIAL_SNAKE, POINTS_PER_FOOD, DIRECTION_OPPOSITE, LEVEL_COUNT, GRID_SIZE, RUNNER_LANE_X, RUNNER_DISTANCE_PER_POINT } from './constants';
import { positionsEqual, isCollision } from './collision';
import { spawnFood } from './food';
import { calculateNewHead } from './snake';
import { loadHighScore, loadLastUnlockedLevel } from './storage';
import { getLevelData, generateObstacles, getPortalPositions } from './levels';
import { generateRunnerCourse, spawnRunnerFood } from './runnerCourse';

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
    isRunner: false,
    distance: 0,
    lane: 1,
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

    case 'START_RUNNER': {
      const initial = getInitialState();
      const runnerSnake: Position[] = [
        { x: RUNNER_LANE_X[1], y: 18 },
        { x: RUNNER_LANE_X[1], y: 19 },
      ];
      const course = generateRunnerCourse(18, runnerSnake, 0);
      return {
        ...initial,
        snake: runnerSnake,
        food: course.food,
        direction: 'UP',
        nextDirection: 'UP',
        status: 'playing',
        isRunner: true,
        obstacles: course.obstacles,
        lastUnlockedLevel: state.lastUnlockedLevel,
        lane: 1,
      };
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

    case 'CHANGE_LANE': {
      if (!state.isRunner || state.status !== 'playing') return state;
      const newLane = Math.max(0, Math.min(2, state.lane + action.payload)) as 0 | 1 | 2;
      if (newLane === state.lane) return state;
      const head = state.snake[0];
      const bodyAtHeadY = state.snake.slice(1).some(
        seg => seg.x === RUNNER_LANE_X[newLane] && seg.y === head.y
      );
      if (bodyAtHeadY) return state;
      return {
        ...state,
        lane: newLane,
        snake: [{ x: RUNNER_LANE_X[newLane], y: head.y }, ...state.snake.slice(1)],
      };
    }

    case 'MOVE_SNAKE': {
      if (state.isRunner) {
        const head = state.snake[0];
        let newHead: Position = { x: RUNNER_LANE_X[state.lane], y: head.y - 1 };

        const wrapped = newHead.y < 0;
        if (wrapped) newHead = { ...newHead, y: 19 };

        if (isCollision(newHead, state.snake, state.obstacles, false)) {
          return markGameOver(state);
        }

        const ateFood = positionsEqual(newHead, state.food.position);
        const newSnake = ateFood
          ? [newHead, ...state.snake]
          : [newHead, ...state.snake.slice(0, -1)];
        const newFoodEaten = state.foodEaten + (ateFood ? 1 : 0);
        const newDistance = state.distance + 1;

        const lengthMultiplier = Math.floor(state.snake.length / 5) + 1;
        let newScore = state.score + (ateFood ? POINTS_PER_FOOD * lengthMultiplier : 0);
        newScore += Math.floor(newDistance / RUNNER_DISTANCE_PER_POINT)
                 - Math.floor(state.distance / RUNNER_DISTANCE_PER_POINT);

        let newFood = state.food;
        let newObstacles = state.obstacles;

        if (ateFood) {
          newFood = spawnRunnerFood(newSnake, newObstacles, newHead.y);
        }

        if (wrapped) {
          const course = generateRunnerCourse(newHead.y, newSnake, newDistance);
          newObstacles = course.obstacles;
          const foodStillValid = !newObstacles.some(o => o.x === newFood.position.x && o.y === newFood.position.y)
            && !newSnake.some(s => s.x === newFood.position.x && s.y === newFood.position.y);
          newFood = foodStillValid ? newFood : course.food;
        }

        return {
          ...state,
          snake: newSnake,
          food: newFood,
          obstacles: newObstacles,
          direction: 'UP',
          nextDirection: 'UP',
          score: newScore,
          distance: newDistance,
          foodEaten: newFoodEaten,
        };
      }

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
        isEndless: false,
        isRunner: false,
        distance: 0,
        lane: 1,
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
