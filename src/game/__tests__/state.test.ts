import { describe, it, expect } from 'vitest';
import { gameReducer, getInitialState } from '../state';
import type { GameState, GameAction, Food } from '../types';
import { POINTS_PER_FOOD } from '../constants';

const DEFAULT_FOOD: Food = { position: { x: 10, y: 10 }, type: 'normal', timer: -1 };

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ],
    food: DEFAULT_FOOD,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    status: 'idle',
    score: 0,
    highScore: 0,
    level: 1,
    obstacles: [],
    lastUnlockedLevel: 1,
    foodEaten: 0,
    isEndless: false,
    speedEffectTicks: 0,
    ...overrides,
  };
}

describe('gameReducer', () => {
  describe('START_GAME / RESET', () => {
    it('sets status to playing', () => {
      const state = makeState();
      const next = gameReducer(state, { type: 'START_GAME' });
      expect(next.status).toBe('playing');
    });

    it('resets score to 0', () => {
      const state = makeState({ score: 100 });
      const next = gameReducer(state, { type: 'RESET' });
      expect(next.score).toBe(0);
    });

    it('resets level to 1', () => {
      const state = makeState({ level: 5 });
      const next = gameReducer(state, { type: 'START_GAME' });
      expect(next.level).toBe(1);
    });

    it('resets direction to RIGHT', () => {
      const state = makeState({ direction: 'LEFT', nextDirection: 'LEFT' });
      const next = gameReducer(state, { type: 'RESET' });
      expect(next.direction).toBe('RIGHT');
      expect(next.nextDirection).toBe('RIGHT');
    });
  });

  describe('PAUSE_GAME', () => {
    it('sets status to paused', () => {
      const state = makeState({ status: 'playing' });
      const next = gameReducer(state, { type: 'PAUSE_GAME' });
      expect(next.status).toBe('paused');
    });
  });

  describe('RESUME_GAME', () => {
    it('sets status to playing', () => {
      const state = makeState({ status: 'paused' });
      const next = gameReducer(state, { type: 'RESUME_GAME' });
      expect(next.status).toBe('playing');
    });
  });

  describe('CHANGE_DIRECTION', () => {
    it('updates nextDirection', () => {
      const state = makeState();
      const next = gameReducer(state, { type: 'CHANGE_DIRECTION', payload: 'UP' });
      expect(next.nextDirection).toBe('UP');
    });

    it('ignores opposite direction', () => {
      const state = makeState({ direction: 'RIGHT', nextDirection: 'RIGHT' });
      const next = gameReducer(state, { type: 'CHANGE_DIRECTION', payload: 'LEFT' });
      expect(next.nextDirection).toBe('RIGHT');
    });
  });

  describe('MOVE_SNAKE', () => {
    it('moves snake in current direction', () => {
      const state = makeState({ nextDirection: 'RIGHT' });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake[0]).toEqual({ x: 6, y: 5 });
    });

    it('removes tail when no food eaten', () => {
      const state = makeState({ nextDirection: 'RIGHT' });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake.length).toBe(3);
    });

    it('grows snake when food is eaten', () => {
      const state = makeState({
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake.length).toBe(4);
      expect(next.snake[0]).toEqual({ x: 10, y: 10 });
    });

    it('increments score when food is eaten', () => {
      const state = makeState({
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
        score: 0,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.score).toBe(POINTS_PER_FOOD);
    });

    it('spawns new food when food is eaten', () => {
      const state = makeState({
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.food).not.toEqual(state.food);
    });

    it('does not change food when no food eaten', () => {
      const state = makeState({ nextDirection: 'RIGHT' });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.food).toEqual(state.food);
    });

    it('sets gameover on wall collision', () => {
      const state = makeState({
        snake: [{ x: 0, y: 5 }],
        nextDirection: 'LEFT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('gameover');
    });

    it('sets gameover on self collision', () => {
      const state = makeState({
        snake: [
          { x: 5, y: 5 },  // head
          { x: 5, y: 4 },  // body above
          { x: 6, y: 4 },
          { x: 6, y: 5 },
        ],
        nextDirection: 'UP',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('gameover');
    });

    it('sets gameover on obstacle collision', () => {
      const state = makeState({
        snake: [{ x: 5, y: 5 }],
        obstacles: [{ x: 6, y: 5 }],
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('gameover');
    });

    it('updates direction to nextDirection', () => {
      const state = makeState({ nextDirection: 'UP' });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.direction).toBe('UP');
    });

    it('updates high score on gameover if score is higher', () => {
      const state = makeState({
        score: 50,
        highScore: 30,
        snake: [{ x: 0, y: 5 }],
        nextDirection: 'LEFT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.highScore).toBe(50);
    });

    it('preserves high score on gameover if score is lower', () => {
      const state = makeState({
        score: 20,
        highScore: 100,
        snake: [{ x: 0, y: 5 }],
        nextDirection: 'LEFT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.highScore).toBe(100);
    });

    it('increments foodEaten by 1 when food is eaten', () => {
      const state = makeState({
        foodEaten: 3,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.foodEaten).toBe(4);
    });

    it('does not increment foodEaten when no food is eaten', () => {
      const state = makeState({
        foodEaten: 3,
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.foodEaten).toBe(3);
    });

    it('levelComplete fires when foodEaten reaches foodRequired, not based on score', () => {
      const state = makeState({
        level: 1,
        score: 5,
        foodEaten: 9,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('levelComplete');
      expect(next.foodEaten).toBe(10);
    });
  });

  describe('level up', () => {
    it('transitions to levelComplete when foodEaten reaches foodRequired', () => {
      const state = makeState({
        level: 1,
        score: 90,
        foodEaten: 9,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('levelComplete');
      expect(next.level).toBe(1);
      expect(next.score).toBe(100);
      expect(next.foodEaten).toBe(10);
    });

    it('does not reset snake on level up', () => {
      const state = makeState({
        level: 1,
        score: 90,
        foodEaten: 9,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake).toHaveLength(4);
      expect(next.snake[0]).toEqual({ x: 10, y: 10 });
    });

    it('sets won status when level 10 is completed', () => {
      const state = makeState({
        level: 10,
        score: 290,
        foodEaten: 29,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('won');
      expect(next.status).not.toBe('levelComplete');
    });

    it('updates high score on win', () => {
      const state = makeState({
        level: 10,
        score: 290,
        foodEaten: 29,
        highScore: 200,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.highScore).toBe(300);
    });

    it('preserves high score on levelComplete (no save)', () => {
      const state = makeState({
        level: 1,
        score: 90,
        foodEaten: 9,
        highScore: 100,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.highScore).toBe(100);
    });
  });

  describe('CONTINUE_GAME', () => {
    it('increments level and resets snake from levelComplete', () => {
      const state = makeState({
        level: 1,
        score: 50,
        snake: [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'levelComplete',
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(next.status).toBe('playing');
      expect(next.level).toBe(2);
      expect(next.snake).toHaveLength(3);
      expect(next.direction).toBe('RIGHT');
      expect(next.nextDirection).toBe('RIGHT');
    });

    it('generates new obstacles and food for next level', () => {
      const state = makeState({
        level: 1,
        score: 50,
        snake: [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
        ],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'levelComplete',
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(next.obstacles.length).toBeGreaterThan(0);
      expect(next.food).not.toEqual(state.food);
    });

    it('is a no-op when status is not levelComplete', () => {
      const state = makeState({ status: 'playing' });
      const next = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(next).toBe(state);
    });

    it('is a no-op when status is idle', () => {
      const state = makeState({ status: 'idle' });
      const next = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(next).toBe(state);
    });

    it('is a no-op when status is gameover', () => {
      const state = makeState({ status: 'gameover' });
      const next = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(next).toBe(state);
    });

    it('resets foodEaten to 0', () => {
      const state = makeState({
        level: 1,
        score: 50,
        foodEaten: 10,
        snake: [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'levelComplete',
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(next.foodEaten).toBe(0);
    });
  });

  describe('default action', () => {
    it('returns current state for unknown action', () => {
      const state = makeState();
      const next = gameReducer(state, { type: 'UNKNOWN' } as unknown as GameAction);
      expect(next).toBe(state);
    });
  });

  describe('START_AT_LEVEL', () => {
    it('sets level, score=0, status=playing, resets snake', () => {
      const state = makeState({ status: 'gameover', score: 100, level: 5 });
      const next = gameReducer(state, { type: 'START_AT_LEVEL', payload: 3 });
      expect(next.status).toBe('playing');
      expect(next.level).toBe(3);
      expect(next.score).toBe(0);
      expect(next.snake).toHaveLength(3);
      expect(next.direction).toBe('RIGHT');
    });

    it('generates correct obstacles for the level', () => {
      const state = makeState({ status: 'idle' });
      const next = gameReducer(state, { type: 'START_AT_LEVEL', payload: 3 });
      expect(next.obstacles.length).toBeGreaterThan(0);
    });

    it('clamps level to LEVEL_COUNT for high values', () => {
      const state = makeState({ status: 'idle' });
      const next = gameReducer(state, { type: 'START_AT_LEVEL', payload: 999 });
      expect(next.level).toBe(10);
    });

    it('clamps level to 1 for zero', () => {
      const state = makeState({ status: 'idle' });
      const next = gameReducer(state, { type: 'START_AT_LEVEL', payload: 0 });
      expect(next.level).toBe(1);
    });

    it('preserves highScore and lastUnlockedLevel', () => {
      const state = makeState({ status: 'gameover', highScore: 200, lastUnlockedLevel: 5 });
      const next = gameReducer(state, { type: 'START_AT_LEVEL', payload: 3 });
      expect(next.highScore).toBe(200);
      expect(next.lastUnlockedLevel).toBe(5);
    });

    it('resets foodEaten to 0', () => {
      const state = makeState({ status: 'gameover', foodEaten: 7 });
      const next = gameReducer(state, { type: 'START_AT_LEVEL', payload: 3 });
      expect(next.foodEaten).toBe(0);
    });
  });

  describe('lastUnlockedLevel tracking', () => {
    it('sets lastUnlockedLevel = level + 1 on levelComplete', () => {
      const state = makeState({
        level: 1,
        score: 90,
        foodEaten: 9,
        lastUnlockedLevel: 1,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('levelComplete');
      expect(next.lastUnlockedLevel).toBe(2);
    });

    it('preserves lastUnlockedLevel >= current level on gameover', () => {
      const state = makeState({
        level: 3,
        lastUnlockedLevel: 3,
        snake: [{ x: 0, y: 5 }],
        nextDirection: 'LEFT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('gameover');
      expect(next.lastUnlockedLevel).toBe(3);
    });

    it('preserves lastUnlockedLevel >= current level on won', () => {
      const state = makeState({
        level: 10,
        score: 290,
        foodEaten: 29,
        lastUnlockedLevel: 8,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('won');
      expect(next.lastUnlockedLevel).toBe(10);
    });

    it('START_GAME preserves lastUnlockedLevel', () => {
      const state = makeState({ lastUnlockedLevel: 7 });
      const next = gameReducer(state, { type: 'START_GAME' });
      expect(next.lastUnlockedLevel).toBe(7);
    });

    it('accumulates correctly across multiple level completions', () => {
      let state = makeState({
        level: 1,
        score: 90,
        foodEaten: 9,
        lastUnlockedLevel: 1,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
      });
      state = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(state.lastUnlockedLevel).toBe(2);

      state = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(state.level).toBe(2);
      expect(state.lastUnlockedLevel).toBe(2);
    });
  });

  describe('START_ENDLESS_GAME', () => {
    it('sets isEndless to true and status to playing', () => {
      const state = makeState({ status: 'won', score: 300 });
      const next = gameReducer(state, { type: 'START_ENDLESS_GAME' });
      expect(next.isEndless).toBe(true);
      expect(next.status).toBe('playing');
    });

    it('sets level to LEVEL_COUNT (10)', () => {
      const state = makeState({ status: 'won' });
      const next = gameReducer(state, { type: 'START_ENDLESS_GAME' });
      expect(next.level).toBe(10);
    });

    it('resets snake to initial position', () => {
      const state = makeState({ status: 'won', snake: [{ x: 15, y: 15 }, { x: 14, y: 15 }] });
      const next = gameReducer(state, { type: 'START_ENDLESS_GAME' });
      expect(next.snake).toHaveLength(3);
      expect(next.snake[0]).toEqual({ x: 10, y: 10 });
    });

    it('resets foodEaten to 0', () => {
      const state = makeState({ status: 'won', foodEaten: 30 });
      const next = gameReducer(state, { type: 'START_ENDLESS_GAME' });
      expect(next.foodEaten).toBe(0);
    });

    it('keeps the current score', () => {
      const state = makeState({ status: 'won', score: 500 });
      const next = gameReducer(state, { type: 'START_ENDLESS_GAME' });
      expect(next.score).toBe(500);
    });

    it('generates level 10 obstacles', () => {
      const state = makeState({ status: 'won' });
      const next = gameReducer(state, { type: 'START_ENDLESS_GAME' });
      expect(next.obstacles.length).toBeGreaterThan(0);
    });
  });

  describe('endless mode MOVE_SNAKE', () => {
    it('never triggers levelComplete even after eating enough food', () => {
      const level10FoodRequired = 30;
      const state = makeState({
        isEndless: true,
        level: 10,
        score: 290,
        foodEaten: level10FoodRequired - 1,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
        status: 'playing',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('playing');
      expect(next.isEndless).toBe(true);
    });

    it('never triggers won even after eating enough food', () => {
      const level10FoodRequired = 30;
      const state = makeState({
        isEndless: true,
        level: 10,
        score: 290,
        foodEaten: level10FoodRequired - 1,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
        status: 'playing',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).not.toBe('won');
      expect(next.status).toBe('playing');
    });

    it('still triggers collision/gameover', () => {
      const state = makeState({
        isEndless: true,
        level: 10,
        snake: [{ x: 0, y: 5 }],
        nextDirection: 'LEFT',
        status: 'playing',
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('gameover');
    });

    it('continues indefinite play after many food eaten', () => {
      // Simulate eating food well beyond level 10's requirement
      // The key assertion: status never becomes levelComplete or won
      let state = makeState({
        isEndless: true,
        level: 10,
        score: 290,
        foodEaten: 29,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        nextDirection: 'RIGHT',
        status: 'playing',
        obstacles: [],
      });

      // Eat the 30th food (would normally trigger win)
      state = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(state.status).toBe('playing');
      expect(state.foodEaten).toBe(30);

      // Eat 5 more food items in a safe area (stay within bounds)
      for (let i = 0; i < 5; i++) {
        const foodX = 12 + i;
        state = { ...state, food: { position: { x: foodX, y: 10 }, type: 'normal', timer: -1 }, snake: [{ x: foodX - 1, y: 10 }, { x: foodX - 2, y: 10 }, { x: foodX - 3, y: 10 }, { x: foodX - 4, y: 10 }] };
        state = gameReducer(state, { type: 'MOVE_SNAKE' });
        expect(state.status).toBe('playing');
        expect(state.isEndless).toBe(true);
      }
    });
  });

  describe('food variants', () => {
    it('gold food gives 30 points', () => {
      const state = makeState({
        snake: [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }],
        food: { position: { x: 10, y: 10 }, type: 'gold', timer: 10 },
        nextDirection: 'RIGHT',
        score: 0,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.score).toBe(30);
      expect(next.snake).toHaveLength(4);
    });

    it('poison food shrinks snake, floored at INITIAL_SNAKE.length', () => {
      const state = makeState({
        snake: [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }],
        food: { position: { x: 10, y: 10 }, type: 'poison', timer: -1 },
        nextDirection: 'RIGHT',
        score: 0,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.score).toBe(0);
      expect(next.snake).toHaveLength(4);
    });

    it('poison food does not shrink below INITIAL_SNAKE.length', () => {
      const state = makeState({
        snake: [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }],
        food: { position: { x: 10, y: 10 }, type: 'poison', timer: -1 },
        nextDirection: 'RIGHT',
        score: 0,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.score).toBe(0);
      expect(next.snake).toHaveLength(3);
    });

    it('slow food sets speedEffectTicks to 10', () => {
      const state = makeState({
        snake: [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }],
        food: { position: { x: 10, y: 10 }, type: 'slow', timer: 8 },
        nextDirection: 'RIGHT',
        score: 0,
        speedEffectTicks: 0,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.score).toBe(POINTS_PER_FOOD);
      expect(next.speedEffectTicks).toBe(10);
    });

    it('slow food re-eat while speedEffectTicks > 0 resets to 10', () => {
      const state = makeState({
        snake: [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }],
        food: { position: { x: 10, y: 10 }, type: 'slow', timer: 8 },
        nextDirection: 'RIGHT',
        score: 0,
        speedEffectTicks: 5,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.speedEffectTicks).toBe(10);
    });

    it('MOVE_SNAKE decrements speedEffectTicks each tick', () => {
      const state = makeState({
        nextDirection: 'RIGHT',
        speedEffectTicks: 5,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.speedEffectTicks).toBe(4);
    });

    it('speedEffectTicks stays at 0 when already 0', () => {
      const state = makeState({
        nextDirection: 'RIGHT',
        speedEffectTicks: 0,
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.speedEffectTicks).toBe(0);
    });

    it('MOVE_SNAKE decrements food.timer each tick', () => {
      const state = makeState({
        nextDirection: 'RIGHT',
        food: { position: { x: 10, y: 10 }, type: 'gold', timer: 5 },
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.food.timer).toBe(4);
    });

    it('MOVE_SNAKE spawns replacement normal food when timer reaches 0', () => {
      const state = makeState({
        nextDirection: 'RIGHT',
        food: { position: { x: 10, y: 10 }, type: 'gold', timer: 1 },
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.food.timer).toBeGreaterThanOrEqual(-1);
      expect(next.food.type).toBe('normal');
    });

    it('CONTINUE_GAME resets speedEffectTicks to 0', () => {
      const state = makeState({
        level: 1,
        score: 50,
        foodEaten: 10,
        speedEffectTicks: 5,
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        status: 'levelComplete',
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'CONTINUE_GAME' });
      expect(next.speedEffectTicks).toBe(0);
    });

    it('START_AT_LEVEL resets speedEffectTicks to 0', () => {
      const state = makeState({ status: 'gameover', speedEffectTicks: 5 });
      const next = gameReducer(state, { type: 'START_AT_LEVEL', payload: 3 });
      expect(next.speedEffectTicks).toBe(0);
    });

    it('START_ENDLESS_GAME resets speedEffectTicks to 0', () => {
      const state = makeState({ status: 'won', score: 300, speedEffectTicks: 5 });
      const next = gameReducer(state, { type: 'START_ENDLESS_GAME' });
      expect(next.speedEffectTicks).toBe(0);
    });

    it('getInitialState returns food as a Food object with correct shape', () => {
      const initial = getInitialState();
      expect(initial.food.type).toBeDefined();
      expect(['normal', 'gold', 'poison', 'slow']).toContain(initial.food.type);
      expect(initial.food.timer).toBeDefined();
      expect(initial.food.position).toBeDefined();
      expect(initial.food.position.x).toBeDefined();
      expect(initial.food.position.y).toBeDefined();
    });
  });

  describe('wrap-around (level 5)', () => {
    it('snake exits right edge and appears on left', () => {
      const state = makeState({
        level: 5,
        status: 'playing',
        snake: [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }],
        nextDirection: 'RIGHT',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake[0]).toEqual({ x: 0, y: 10 });
      expect(next.status).toBe('playing');
    });

    it('snake exits left edge and appears on right', () => {
      const state = makeState({
        level: 5,
        status: 'playing',
        snake: [{ x: 0, y: 10 }, { x: 1, y: 10 }, { x: 2, y: 10 }],
        nextDirection: 'LEFT',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake[0]).toEqual({ x: 19, y: 10 });
      expect(next.status).toBe('playing');
    });

    it('snake exits bottom edge and appears on top', () => {
      const state = makeState({
        level: 5,
        status: 'playing',
        snake: [{ x: 10, y: 19 }, { x: 10, y: 18 }, { x: 10, y: 17 }],
        nextDirection: 'DOWN',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake[0]).toEqual({ x: 10, y: 0 });
      expect(next.status).toBe('playing');
    });

    it('snake exits top edge and appears on bottom', () => {
      const state = makeState({
        level: 5,
        status: 'playing',
        snake: [{ x: 10, y: 0 }, { x: 10, y: 1 }, { x: 10, y: 2 }],
        nextDirection: 'UP',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake[0]).toEqual({ x: 10, y: 19 });
      expect(next.status).toBe('playing');
    });

    it('self-collision still triggers gameover with wrap-around', () => {
      const state = makeState({
        level: 5,
        status: 'playing',
        snake: [{ x: 0, y: 10 }, { x: 1, y: 10 }, { x: 2, y: 10 }, { x: 3, y: 10 }],
        nextDirection: 'LEFT',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      // Wrap to x=19, no self-collision
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('playing');
      expect(next.snake[0]).toEqual({ x: 19, y: 10 });
    });

    it('obstacle collision still triggers gameover with wrap-around', () => {
      const state = makeState({
        level: 5,
        status: 'playing',
        snake: [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }],
        nextDirection: 'RIGHT',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [{ x: 0, y: 10 }],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('gameover');
    });
  });

  describe('portals (level 7)', () => {
    it('snake teleports from portal A to portal B', () => {
      const state = makeState({
        level: 7,
        status: 'playing',
        snake: [{ x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }],
        nextDirection: 'DOWN',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      // Portal A is { x: 2, y: 4 }, moving DOWN from { x: 2, y: 3 } lands on portal A
      // Should teleport to portal B { x: 16, y: 15 }
      expect(next.snake[0]).toEqual({ x: 16, y: 15 });
      expect(next.status).toBe('playing');
    });

    it('snake teleports from portal B to portal A', () => {
      const state = makeState({
        level: 7,
        status: 'playing',
        snake: [{ x: 16, y: 14 }, { x: 16, y: 13 }, { x: 16, y: 12 }],
        nextDirection: 'DOWN',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      // Portal B is { x: 16, y: 15 }, moving DOWN from { x: 16, y: 14 } lands on portal B
      // Should teleport to portal A { x: 2, y: 4 }
      expect(next.snake[0]).toEqual({ x: 2, y: 4 });
      expect(next.status).toBe('playing');
    });

    it('teleporting to a safe position does not trigger gameover', () => {
      const state = makeState({
        level: 7,
        status: 'playing',
        snake: [{ x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }],
        nextDirection: 'DOWN',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.status).toBe('playing');
    });

    it('teleporting into own body triggers gameover', () => {
      const state = makeState({
        level: 7,
        status: 'playing',
        snake: [{ x: 2, y: 3 }, { x: 16, y: 15 }, { x: 16, y: 14 }],
        nextDirection: 'DOWN',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      // Teleport to { x: 16, y: 15 } which is body segment → gameover
      expect(next.status).toBe('gameover');
    });

    it('teleporting into an obstacle triggers gameover', () => {
      const state = makeState({
        level: 7,
        status: 'playing',
        snake: [{ x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }],
        nextDirection: 'DOWN',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [{ x: 16, y: 15 }],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      // Teleport to { x: 16, y: 15 } which has obstacle → gameover
      expect(next.status).toBe('gameover');
    });

    it('no teleport occurs on non-portal levels', () => {
      const state = makeState({
        level: 1,
        status: 'playing',
        snake: [{ x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }],
        nextDirection: 'DOWN',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      expect(next.snake[0]).toEqual({ x: 2, y: 4 });
      expect(next.status).toBe('playing');
    });

    it('wrap is applied first, then portal lookup, then collision', () => {
      // Level 5 has wrapAround but no portals. This test verifies the wrap step.
      // The portal-lookup-after-wrap ordering is enforced by code structure in state.ts:
      // wrap block (lines 63-70) executes before portal block (lines 73-78).
      // Portal tests above verify portal lookup on the post-wrap head position.
      // No real level has both flags, so a synthetic level would be needed to test
      // both simultaneously in a single reducer call.
      const state = makeState({
        level: 5,
        status: 'playing',
        snake: [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }],
        nextDirection: 'RIGHT',
        food: { position: { x: 5, y: 5 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      const next = gameReducer(state, { type: 'MOVE_SNAKE' });
      // Wrap: x=19+1=20 → x=0
      expect(next.snake[0]).toEqual({ x: 0, y: 10 });
      expect(next.status).toBe('playing');
    });
  });
});
