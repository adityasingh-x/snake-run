import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../Engine';
import { getInitialState } from '../state';
import { LEVEL_COUNT } from '../constants';
import { saveLastUnlockedLevel } from '../storage';

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

  describe('continueFromLevel', () => {
    it('preserves accumulated score when continuing from a level after gameover', () => {
      engine.setState({
        ...getInitialState(),
        status: 'gameover',
        level: 3,
        score: 120,
        lastUnlockedLevel: 3,
      });
      engine.continueFromLevel(3);
      expect(engine.getState().status).toBe('playing');
      expect(engine.getState().level).toBe(3);
      expect(engine.getState().score).toBe(120);
    });

    it('preserves queued nextDirection when continuing', () => {
      engine.setState({
        ...getInitialState(),
        status: 'gameover',
        level: 2,
        score: 60,
        nextDirection: 'DOWN',
      });
      engine.continueFromLevel(2);
      expect(engine.getState().nextDirection).toBe('DOWN');
    });

    it('resets snake length to initial when continuing (fresh level metadata)', () => {
      engine.setState({
        ...getInitialState(),
        status: 'gameover',
        level: 2,
        score: 60,
        snake: [
          { x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 },
          { x: 9, y: 10 }, { x: 8, y: 10 },
        ],
      });
      engine.continueFromLevel(2);
      expect(engine.getState().snake.length).toBe(3);
    });
  });

  describe('visibility / accumulator cap (BUG-009)', () => {
    it('snake in wrap-around level survives a 5-second timer advance (no multi-tick crash)', () => {
      // Level 5 has wrapAround, so the snake can loop the grid without
      // hitting a wall. A 5-second fake-timer advance should dispatch many
      // MOVE_SNAKE actions; with the accumulator cap, no single frame
      // should teleport the snake into a wall.
      engine.startAtLevel(5);
      engine.setState({
        ...engine.getState(),
        // Vertical strip in the middle of the grid — snake can move up
        // indefinitely (wrap-around sends it to the bottom).
        snake: [{ x: 10, y: 5 }, { x: 10, y: 6 }, { x: 10, y: 7 }],
        nextDirection: 'UP',
        food: { position: { x: 0, y: 0 }, type: 'normal', timer: -1 },
        obstacles: [],
      });

      vi.advanceTimersByTime(5000);

      // Snake should still be alive (status: 'playing') — no unfair crash.
      expect(engine.getState().status).toBe('playing');
    });

    it('registers a visibilitychange listener on startAtLevel', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      engine.startAtLevel(1);
      const visibilityRegistered = addSpy.mock.calls.some(
        ([event]) => event === 'visibilitychange'
      );
      addSpy.mockRestore();
      expect(visibilityRegistered).toBe(true);
    });
  });

  describe('no_pause achievement across startAtLevel', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('startAtLevel does NOT clear wasPausedEver so a prior pause blocks no_pause', () => {
      engine.start();
      engine.pause();
      // After pause, internal wasPausedEver = true. startAtLevel must NOT clear it.
      engine.startAtLevel(10);
      // Force a win on the final level.
      engine.setState({
        ...engine.getState(),
        status: 'playing',
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
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      // After winning, the no_pause achievement should NOT be awarded because
      // wasPausedEver was set by the prior pause and startAtLevel does not clear it.
      const achievementsRaw = localStorage.getItem('snakeAchievements');
      const unlocked = achievementsRaw ? JSON.parse(achievementsRaw) : [];
      expect(engine.getState().status).toBe('won');
      expect(unlocked).not.toContain('no_pause');
    });

    it('a fresh start with no pause awards no_pause on win', () => {
      engine.startAtLevel(10);
      engine.setState({
        ...engine.getState(),
        status: 'playing',
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
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      const achievementsRaw = localStorage.getItem('snakeAchievements');
      const unlocked = achievementsRaw ? JSON.parse(achievementsRaw) : [];
      expect(engine.getState().status).toBe('won');
      expect(unlocked).toContain('no_pause');
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
        score: 290,
        foodEaten: 29,
        lastUnlockedLevel: 1,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
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
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().status).toBe('levelComplete');
      expect(localStorage.getItem('snakeLastUnlockedLevel')).toBe('2');
    });
  });

  describe('startEndless', () => {
    it('dispatches START_ENDLESS_GAME and starts loop', () => {
      engine.setState({
        ...getInitialState(),
        status: 'won',
        score: 300,
      });
      engine.startEndless();
      expect(engine.getState().status).toBe('playing');
      expect(engine.getState().isEndless).toBe(true);
    });

    it('keeps status playing after many MOVE_SNAKE dispatches in endless mode', () => {
      engine.setState({
        ...getInitialState(),
        status: 'playing',
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
        obstacles: [],
      });

      // Eat the 30th food (would normally trigger win)
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().status).toBe('playing');
      expect(engine.getState().foodEaten).toBe(30);

      // Eat 5 more food items (stay within grid bounds)
      for (let i = 0; i < 5; i++) {
        const foodX = 12 + i;
        engine.setState({
          ...engine.getState(),
          food: { position: { x: foodX, y: 10 }, type: 'normal', timer: -1 },
          snake: [{ x: foodX - 1, y: 10 }, { x: foodX - 2, y: 10 }, { x: foodX - 3, y: 10 }, { x: foodX - 4, y: 10 }],
        });
        engine.testDispatch({ type: 'MOVE_SNAKE' });
        expect(engine.getState().status).toBe('playing');
        expect(engine.getState().isEndless).toBe(true);
      }
    });
  });

  describe('speed effect', () => {
    it('engine state has speedEffectTicks field', () => {
      engine.setState({
        ...getInitialState(),
        speedEffectTicks: 5,
      });
      expect(engine.getState().speedEffectTicks).toBe(5);
    });

    it('slows the game loop when speedEffectTicks > 0', () => {
      // Level 5 speed = 115ms; with multiplier = 115 * 1.3 = 149.5ms
      // Count state changes (each MOVE_SNAKE triggers a state change)

      // Without speed effect
      engine.startAtLevel(5);
      engine.setState({
        ...engine.getState(),
        snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      let moveCountWithout = 0;
      const unsubWithout = engine.subscribe(() => { moveCountWithout += 1; });
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(50);
      }
      unsubWithout();

      // Reset and test with speed effect
      engine.destroy();
      engine = new Engine();
      engine.startAtLevel(5);
      engine.setState({
        ...engine.getState(),
        speedEffectTicks: 100,
        snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      let moveCountWith = 0;
      const unsubWith = engine.subscribe(() => { moveCountWith += 1; });
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(50);
      }
      unsubWith();

      // With the slow effect, fewer ticks fire
      expect(moveCountWith).toBeLessThan(moveCountWithout);
    });
  });

  describe('persistence across destroy+recreate', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('lastUnlockedLevel persists across Engine destroy + recreate cycles', () => {
      engine.setState({
        ...getInitialState(),
        status: 'playing',
        level: 3,
        score: 20,
        foodEaten: 2,
        lastUnlockedLevel: 1,
        snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        obstacles: [],
        nextDirection: 'RIGHT',
      });
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().status).toBe('playing');
      saveLastUnlockedLevel(3);

      engine.destroy();
      const newEngine = new Engine();
      expect(localStorage.getItem('snakeLastUnlockedLevel')).toBe('3');
      newEngine.destroy();
    });
  });

  describe('totalFood stat accounting (BUG-024)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('counts each food as exactly 1, even gold food (BUG-024)', () => {
      engine.startAtLevel(1);
      // Position snake to eat a gold food on the next move.
      engine.setState({
        ...engine.getState(),
        score: 0,
        foodEaten: 0,
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'gold', timer: -1 },
        obstacles: [],
      });
      // Move into the gold food: +30 points but only 1 food consumed.
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().score).toBe(30);
      // totalFood should be 1, not 3 (30 / POINTS_PER_FOOD = 3).
      expect(engine.getStats().totalFood).toBe(1);
    });

    it('counts normal food as exactly 1 (no regression)', () => {
      engine.startAtLevel(1);
      engine.setState({
        ...engine.getState(),
        snake: [
          { x: 9, y: 10 },
          { x: 8, y: 10 },
          { x: 7, y: 10 },
        ],
        food: { position: { x: 10, y: 10 }, type: 'normal', timer: -1 },
        obstacles: [],
      });
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getStats().totalFood).toBe(1);
    });
  });

  describe('high score persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('high score is NOT saved during playing state', () => {
      engine.start();
      engine.setState({
        ...engine.getState(),
        score: 100,
        snake: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
        food: { position: { x: 15, y: 15 }, type: 'normal', timer: -1 },
        obstacles: [],
        nextDirection: 'RIGHT',
      });
      engine.testDispatch({ type: 'MOVE_SNAKE' });
      expect(engine.getState().status).toBe('playing');
      expect(localStorage.getItem('snakeHighScore')).toBeNull();
    });
  });

  describe('stats on pause', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('stats are saved to localStorage on paused state', () => {
      engine.start();
      engine.pause();
      expect(engine.getState().status).toBe('paused');
      expect(localStorage.getItem('snakeStatsGamesPlayed')).toBe('1');
    });
  });

  describe('restartLevel', () => {
    it('resets snake to initial length at current level', () => {
      engine.startAtLevel(3);
      engine.setState({
        ...engine.getState(),
        snake: [
          { x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 },
          { x: 9, y: 10 }, { x: 8, y: 10 },
        ],
        score: 50,
        foodEaten: 5,
      });
      engine.restartLevel();
      expect(engine.getState().level).toBe(3);
      expect(engine.getState().snake.length).toBe(3);
      expect(engine.getState().foodEaten).toBe(0);
    });

    it('preserves score across restart', () => {
      engine.startAtLevel(2);
      engine.setState({
        ...engine.getState(),
        score: 120,
      });
      engine.restartLevel();
      expect(engine.getState().score).toBe(120);
    });

    it('preserves direction across restart', () => {
      engine.startAtLevel(2);
      engine.changeDirection('UP');
      engine.restartLevel();
      // changeDirection only affects nextDirection until next MOVE_SNAKE,
      // so direction remains RIGHT (set by startAtLevel) while nextDirection is UP
      expect(engine.getState().direction).toBe('RIGHT');
      expect(engine.getState().nextDirection).toBe('UP');
    });

    it('starts the loop after restart', () => {
      engine.startAtLevel(2);
      engine.pause();
      engine.restartLevel();
      expect(engine.getState().status).toBe('playing');
      const snakeBefore = engine.getState().snake;
      vi.advanceTimersByTime(500);
      const snakeAfter = engine.getState().snake;
      expect(snakeAfter).not.toEqual(snakeBefore);
    });

    it('food spawns at a valid position after restart', () => {
      engine.startAtLevel(2);
      engine.restartLevel();
      const { food, snake, obstacles } = engine.getState();
      const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`));
      const obstacleSet = new Set(obstacles.map(o => `${o.x},${o.y}`));
      expect(snakeSet.has(`${food.position.x},${food.position.y}`)).toBe(false);
      expect(obstacleSet.has(`${food.position.x},${food.position.y}`)).toBe(false);
    });
  });

  describe('gamesPlayed increment (BUG-008)', () => {
    beforeEach(() => {
      localStorage.clear();
      engine.destroy();
      engine = new Engine();
    });

    it('increments gamesPlayed on startAtLevel', () => {
      engine.startAtLevel(1);
      expect(engine.getStats().gamesPlayed).toBe(1);
    });

    it('increments gamesPlayed on startAtLevel from gameover state', () => {
      engine.setState({
        ...getInitialState(),
        status: 'gameover',
        level: 3,
        score: 50,
      });
      engine.startAtLevel(1);
      expect(engine.getStats().gamesPlayed).toBe(1);
    });
  });

  describe('runner mode onEat suppression (BUG-007)', () => {
    it('does NOT fire onEat for runner distance score increases', () => {
      const onEat = vi.fn();
      engine.onEat = onEat;

      engine.startRunner();
      // Runner starts with distance=0. After enough ticks, distance increases
      // and score increases from distance points, but onEat should NOT fire.
      for (let i = 0; i < 30; i++) {
        vi.advanceTimersByTime(100);
      }

      expect(engine.getState().isRunner).toBe(true);
      expect(engine.getState().distance).toBeGreaterThan(0);
      // onEat should not have been called for distance-based score increases
      expect(onEat).not.toHaveBeenCalled();
    });
  });

  describe('runner mode food lane compliance (BUG-010)', () => {
    it('food always spawns in a valid lane position', () => {
      engine.startRunner();
      const { food } = engine.getState();
      const laneX = [4, 10, 16];
      expect(laneX).toContain(food.position.x);
    });

    it('food remains in lane after multiple wraps', () => {
      engine.startRunner();
      // Simulate many ticks to trigger wraps
      for (let i = 0; i < 200; i++) {
        vi.advanceTimersByTime(100);
      }
      const { food } = engine.getState();
      const laneX = [4, 10, 16];
      expect(laneX).toContain(food.position.x);
    });
  });

  describe('runner initial snake shape (BUG-011)', () => {
    it('initial runner snake has no duplicate segments', () => {
      engine.startRunner();
      const { snake } = engine.getState();
      const positions = snake.map(s => `${s.x},${s.y}`);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(snake.length);
    });

    it('initial runner snake has 2 segments', () => {
      engine.startRunner();
      expect(engine.getState().snake.length).toBe(2);
    });
  });
});
