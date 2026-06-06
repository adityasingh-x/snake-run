import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../Engine';
import { getInitialState } from '../state';
import { LEVEL_COUNT } from '../constants';

describe('Engine', () => {
  let engine: Engine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new Engine();
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  it('initializes with idle status', () => {
    expect(engine.getState().status).toBe('idle');
  });

  it('starts game and sets status to playing', () => {
    engine.start();
    expect(engine.getState().status).toBe('playing');
  });

  it('pauses game', () => {
    engine.start();
    engine.pause();
    expect(engine.getState().status).toBe('paused');
  });

  it('resumes game from paused', () => {
    engine.start();
    engine.pause();
    engine.resume();
    expect(engine.getState().status).toBe('playing');
  });

  it('changes direction', () => {
    engine.start();
    engine.changeDirection('UP');
    expect(engine.getState().nextDirection).toBe('UP');
  });

  it('ignores opposite direction', () => {
    engine.start();
    engine.changeDirection('LEFT');
    expect(engine.getState().nextDirection).toBe('RIGHT');
  });

  it('resets game to initial state', () => {
    engine.start();
    engine.changeDirection('UP');
    engine.reset();
    expect(engine.getState().status).toBe('playing');
    expect(engine.getState().score).toBe(0);
  });

  it('continues running the loop after reset', () => {
    engine.start();
    engine.pause();
    engine.reset();
    const startState = engine.getState();
    vi.advanceTimersByTime(200);
    const afterReset = engine.getState();
    expect(afterReset.snake).not.toEqual(startState.snake);
  });

  it('stops the game loop on game over', () => {
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.start();
    engine.changeDirection('UP');
    engine.changeDirection('LEFT');
    engine.changeDirection('DOWN');
    vi.advanceTimersByTime(5000);
    expect(engine.getState().status).toBe('gameover');
    const callsAtGameOver = listener.mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect(listener.mock.calls.length).toBe(callsAtGameOver);
  });

  it('subscribes to state changes', () => {
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.start();
    expect(listener).toHaveBeenCalled();
  });

  it('unsubscribes listener', () => {
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    unsubscribe();
    engine.start();
    expect(listener).not.toHaveBeenCalled();
  });

  it('cleans up on destroy', () => {
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.start();
    engine.destroy();
    engine.start();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  describe('sound callback wiring', () => {
    it('exposes onEat, onLevelUp, onGameOver, onWin as optional callbacks', () => {
      expect(engine.onEat).toBeUndefined();
      expect(engine.onLevelUp).toBeUndefined();
      expect(engine.onGameOver).toBeUndefined();
      expect(engine.onWin).toBeUndefined();
    });

    it('stores callback functions when assigned', () => {
      const onEat = vi.fn();
      const onLevelUp = vi.fn();
      const onGameOver = vi.fn();
      const onWin = vi.fn();
      engine.onEat = onEat;
      engine.onLevelUp = onLevelUp;
      engine.onGameOver = onGameOver;
      engine.onWin = onWin;
      expect(engine.onEat).toBe(onEat);
      expect(engine.onLevelUp).toBe(onLevelUp);
      expect(engine.onGameOver).toBe(onGameOver);
      expect(engine.onWin).toBe(onWin);
    });

    it('does not fire any sound callback on START_GAME (no score/level change)', () => {
      const onEat = vi.fn();
      const onLevelUp = vi.fn();
      const onGameOver = vi.fn();
      const onWin = vi.fn();
      engine.onEat = onEat;
      engine.onLevelUp = onLevelUp;
      engine.onGameOver = onGameOver;
      engine.onWin = onWin;

      engine.start();

      expect(onEat).not.toHaveBeenCalled();
      expect(onLevelUp).not.toHaveBeenCalled();
      expect(onGameOver).not.toHaveBeenCalled();
      expect(onWin).not.toHaveBeenCalled();
    });

    it('fires onGameOver when the snake crashes', () => {
      const onGameOver = vi.fn();
      engine.onGameOver = onGameOver;

      engine.start();
      engine.changeDirection('UP');
      engine.changeDirection('LEFT');
      engine.changeDirection('DOWN');
      vi.advanceTimersByTime(5000);

      expect(engine.getState().status).toBe('gameover');
      expect(onGameOver).toHaveBeenCalled();
    });
  });

  describe('continueGame', () => {
    it('is a no-op when status is not levelComplete', () => {
      const onLevelUp = vi.fn();
      engine.onLevelUp = onLevelUp;

      engine.start();
      expect(engine.getState().status).toBe('playing');

      engine.continueGame();

      expect(engine.getState().status).toBe('playing');
      expect(onLevelUp).not.toHaveBeenCalled();
    });

    it('transitions from levelComplete to playing, increments level, resumes loop, and fires onLevelUp', () => {
      const onLevelUp = vi.fn();
      const listener = vi.fn();
      engine.onLevelUp = onLevelUp;
      engine.subscribe(listener);

      // Set engine to levelComplete state
      engine.setState({
        ...getInitialState(),
        status: 'levelComplete',
        level: 1,
        score: 50,
      });

      engine.continueGame();

      // (a) Status is playing
      expect(engine.getState().status).toBe('playing');
      // (b) Level is incremented
      expect(engine.getState().level).toBe(2);
      // (c) Loop is running — advance timers and verify snake moves
      const snakeBefore = engine.getState().snake;
      vi.advanceTimersByTime(500);
      const snakeAfter = engine.getState().snake;
      expect(snakeAfter).not.toEqual(snakeBefore);
      // (d) onLevelUp callback fired
      expect(onLevelUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('startAtLevel', () => {
    it('starts playing at level 5 from idle', () => {
      engine.startAtLevel(5);
      expect(engine.getState().status).toBe('playing');
      expect(engine.getState().level).toBe(5);
      expect(engine.getState().score).toBe(0);
    });

    it('starts playing at level 3 from gameover', () => {
      engine.setState({
        ...getInitialState(),
        status: 'gameover',
        level: 2,
        score: 50,
      });
      engine.startAtLevel(3);
      expect(engine.getState().status).toBe('playing');
      expect(engine.getState().level).toBe(3);
    });

    it('clamps level to LEVEL_COUNT for high values', () => {
      engine.startAtLevel(999);
      expect(engine.getState().level).toBe(LEVEL_COUNT);
    });

    it('loop starts after startAtLevel — snake moves after advanceTimers', () => {
      engine.startAtLevel(1);
      const snakeBefore = engine.getState().snake;
      vi.advanceTimersByTime(500);
      const snakeAfter = engine.getState().snake;
      expect(snakeAfter).not.toEqual(snakeBefore);
    });
  });

  describe('lastUnlockedLevel persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('persists lastUnlockedLevel on gameover', () => {
      engine.setState({
        ...getInitialState(),
        status: 'playing',
        level: 4,
        score: 100,
        lastUnlockedLevel: 1,
        snake: [{ x: 0, y: 5 }],
        nextDirection: 'LEFT',
      });
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().status).toBe('gameover');
      expect(localStorage.getItem('snakeLastUnlockedLevel')).toBe('4');
    });

    it('persists lastUnlockedLevel on won', () => {
      engine.setState({
        ...getInitialState(),
        status: 'playing',
        level: 10,
        score: 490,
        lastUnlockedLevel: 1,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { x: 10, y: 10 },
        nextDirection: 'RIGHT',
      });
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().status).toBe('won');
      expect(localStorage.getItem('snakeLastUnlockedLevel')).toBe('10');
    });

    it('persists lastUnlockedLevel on levelComplete', () => {
      engine.setState({
        ...getInitialState(),
        status: 'playing',
        level: 1,
        score: 40,
        lastUnlockedLevel: 1,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { x: 10, y: 10 },
        nextDirection: 'RIGHT',
      });
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().status).toBe('levelComplete');
      expect(localStorage.getItem('snakeLastUnlockedLevel')).toBe('2');
    });
  });
});
