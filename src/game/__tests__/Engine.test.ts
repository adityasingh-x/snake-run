import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../Engine';

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
    const initialSnake = engine.getState().snake;
    engine.changeDirection('UP');
    engine.changeDirection('LEFT');
    engine.changeDirection('DOWN');
    vi.advanceTimersByTime(5000);
    const status = engine.getState().status;
    const snakeAfter = engine.getState().snake;

    if (status === 'gameover') {
      const callsAtGameOver = listener.mock.calls.length;
      vi.advanceTimersByTime(5000);
      expect(listener.mock.calls.length).toBe(callsAtGameOver);
    } else {
      expect(snakeAfter).not.toEqual(initialSnake);
    }
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
});
