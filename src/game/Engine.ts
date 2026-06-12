import type { GameState, GameAction, Direction } from './types';
import { getInitialState, gameReducer } from './state';
import { RUNNER_INITIAL_SPEED, RUNNER_MIN_SPEED, RUNNER_SPEED_MULTIPLIER } from './constants';
import { getLevelData } from './levels';
import { getMultiplier } from './snake';
import { saveHighScore, saveLastUnlockedLevel } from './storage';
import { loadStats, saveStats } from './statistics';
import type { Stats } from './statistics';
import { checkAchievements, saveAchievement, loadAchievements } from './achievements';

const SLOW_EFFECT_MULTIPLIER = 1.3;

export type GameEventListener = (state: GameState) => void;

export class Engine {
  private state: GameState;
  private listeners: Set<GameEventListener> = new Set();
  private rafId: number | null = null;
  private lastTick: number = 0;
  private accumulator: number = 0;
  private statsCache: Stats;
  // Engine-private tracker for the no_pause achievement; never read by UI or reducer.
  // wasPausedEver persists across resets so the achievement cannot be earned by
  // restarting after a pause.
  private wasPausedEver: boolean = false;
  // Cached set of unlocked achievement IDs to avoid per-dispatch localStorage reads.
  private unlockedAchievementIds: Set<string>;

  constructor() {
    this.state = getInitialState();
    this.statsCache = loadStats();
    this.unlockedAchievementIds = new Set(loadAchievements().filter(a => a.unlocked).map(a => a.id));
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private dispatch(action: GameAction): void {
    const prevScore = this.state.score;
    const prevLevel = this.state.level;
    const prevFoodEaten = this.state.foodEaten;
    const prevState = { ...this.state };

    if (action.type === 'START_GAME' || action.type === 'RESET' || action.type === 'START_ENDLESS_GAME' || action.type === 'START_RUNNER' || action.type === 'START_AT_LEVEL') {
      this.statsCache.gamesPlayed += 1;
    }

    this.state = gameReducer(this.state, action);

    if (this.state.status === 'gameover' || this.state.status === 'won') {
      saveHighScore(this.state.score);
      saveLastUnlockedLevel(this.state.lastUnlockedLevel);
    }

    if (this.state.status === 'levelComplete') {
      saveLastUnlockedLevel(this.state.lastUnlockedLevel);
    }

    if (this.state.foodEaten > prevFoodEaten) {
      // Count each food consumption as exactly 1, regardless of point value.
      // (Previously derived from score/POINTS_PER_FOOD, which inflated totalFood
      // 3x for gold food — gold gives 30 points but is still a single item.)
      this.statsCache.totalFood += 1;
    }

    if (this.state.level > prevLevel) {
      this.statsCache.bestLevel = Math.max(this.statsCache.bestLevel, this.state.level);
    }

    if (this.state.status === 'gameover' || this.state.status === 'won' || this.state.status === 'paused') {
      this.statsCache.highScore = this.state.highScore;
      saveStats(this.statsCache);
    }

    const newlyUnlocked = checkAchievements(this.state, prevState, this.wasPausedEver, this.unlockedAchievementIds);
    for (const id of newlyUnlocked) {
      saveAchievement(id);
      this.unlockedAchievementIds.add(id);
      this.onAchievementUnlock?.(id);
    }

    this.listeners.forEach(listener => listener(this.state));

    if (this.state.status === 'gameover' || this.state.status === 'won') {
      this.stopLoop();
    }

    if (this.state.score > prevScore && !this.state.isRunner) {
      this.onEat?.();
    }
    if (this.state.level > prevLevel && this.state.status === 'playing') {
      this.onLevelUp?.();
    }
    if (this.state.status === 'gameover') {
      this.onGameOver?.();
    }
    if (this.state.status === 'won') {
      this.onWin?.();
    }
    if (this.state.isRunner && this.state.status === 'playing' && this.state.foodEaten > prevFoodEaten) {
      const newMultiplier = getMultiplier(this.state.snake.length);
      const prevMultiplier = getMultiplier(prevState.snake.length);
      if (newMultiplier > prevMultiplier) {
        this.onMilestone?.(newMultiplier as 2 | 3 | 4 | 5);
      }
    }
  }

  start(): void {
    this.wasPausedEver = false;
    this.dispatch({ type: 'START_GAME' });
    this.startLoop();
  }

  pause(): void {
    this.wasPausedEver = true;
    this.dispatch({ type: 'PAUSE_GAME' });
    this.stopLoop();
  }

  resume(): void {
    this.dispatch({ type: 'RESUME_GAME' });
    this.startLoop();
  }

  changeDirection(direction: Direction): void {
    this.dispatch({ type: 'CHANGE_DIRECTION', payload: direction });
  }

  reset(): void {
    this.dispatch({ type: 'RESET' });
    if (this.state.status === 'playing') {
      this.startLoop();
    }
  }

  continueGame(): void {
    this.dispatch({ type: 'CONTINUE_GAME' });
    this.startLoop();
  }

  startAtLevel(level: number): void {
    this.dispatch({ type: 'START_AT_LEVEL', payload: level });
    this.startLoop();
  }

  /**
   * Continue from a chosen level after gameover without discarding the
   * accumulated run score. Mirrors restartLevel: captures score and
   * nextDirection, dispatches START_AT_LEVEL (which resets level metadata),
   * then restores the run state and notifies subscribers.
   */
  continueFromLevel(level: number): void {
    const savedScore = this.state.score;
    const savedNextDirection = this.state.nextDirection;
    this.dispatch({ type: 'START_AT_LEVEL', payload: level });
    this.state = {
      ...this.state,
      score: savedScore,
      nextDirection: savedNextDirection,
    };
    this.listeners.forEach(listener => listener(this.state));
    this.startLoop();
  }

  /**
   * Restart the current level without resetting accumulated run state.
   * Preserves score, direction, and nextDirection while resetting level
   * metadata (obstacles, food, snake length, foodEaten). START_AT_LEVEL
   * always resets these fields by design, so the explicit restore after
   * dispatch is the additive behavior that makes this a "retry" rather
   * than a "fresh start."
   */
  restartLevel(): void {
    const savedScore = this.state.score;
    const savedDirection = this.state.direction;
    const savedNextDirection = this.state.nextDirection;
    this.dispatch({ type: 'START_AT_LEVEL', payload: this.state.level });
    // Restore accumulated run state; level metadata (obstacles, food) is already reset
    this.state = {
      ...this.state,
      score: savedScore,
      direction: savedDirection,
      nextDirection: savedNextDirection,
    };
    this.listeners.forEach(listener => listener(this.state));
    this.startLoop();
  }

  startEndless(): void {
    this.wasPausedEver = false;
    this.dispatch({ type: 'START_ENDLESS_GAME' });
    this.startLoop();
  }

  startRunner(): void {
    this.wasPausedEver = false;
    this.dispatch({ type: 'START_RUNNER' });
    this.startLoop();
  }

  changeLane(delta: -1 | 1): void {
    this.dispatch({ type: 'CHANGE_LANE', payload: delta });
  }

  getStats(): Stats {
    return { ...this.statsCache, highScore: this.state.highScore };
  }

  getTickInterval(): number {
    return this.getEffectiveSpeed();
  }

  private getEffectiveSpeed(): number {
    if (this.state.isRunner) {
      const speed = Math.max(
        RUNNER_MIN_SPEED,
        RUNNER_INITIAL_SPEED - Math.floor(this.state.distance / 50) * 2
      );
      return Math.round(speed / RUNNER_SPEED_MULTIPLIER);
    } else {
      const config = getLevelData(this.state.level);
      const speed = config.speed ?? 150;
      return this.state.speedEffectTicks > 0 ? speed * SLOW_EFFECT_MULTIPLIER : speed;
    }
  }

  /** Test-only: set internal state for testing purposes. */
  setState(state: GameState): void {
    this.state = state;
  }

  /** Test-only: dispatch an action for testing purposes. */
  testDispatch(action: GameAction): void {
    this.dispatch(action);
  }

  private startLoop(): void {
    if (this.rafId !== null) return;

    this.lastTick = 0;
    this.accumulator = 0;
    this.ensureVisibilityListener();

    const tick = (timestamp: number) => {
      if (this.state.status !== 'playing') {
        this.rafId = null;
        return;
      }

      if (this.lastTick === 0) {
        this.lastTick = timestamp;
      }

      const delta = timestamp - this.lastTick;
      this.lastTick = timestamp;
      this.accumulator += delta;

      // Cap accumulator to a single effective tick to avoid multi-tick jumps
      // after tab refocus or long pauses. Without this, a single frame can
      // dispatch many MOVE_SNAKE actions and the snake teleports into walls.
      const effectiveSpeed = this.getEffectiveSpeed();
      if (this.accumulator > effectiveSpeed) {
        this.accumulator = effectiveSpeed;
      }

      if (this.accumulator >= effectiveSpeed) {
        this.dispatch({ type: 'MOVE_SNAKE' });
        this.accumulator = 0;
      }

      if (this.state.status === 'playing') {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTick = 0;
    this.accumulator = 0;
  }

  onEat?: () => void;
  onLevelUp?: () => void;
  onGameOver?: () => void;
  onWin?: () => void;
  onMilestone?: (tier: 2 | 3 | 4 | 5) => void;
  onAchievementUnlock?: (id: string) => void;

  private visibilityHandler: (() => void) | null = null;

  destroy(): void {
    this.stopLoop();
    this.listeners.clear();
    if (typeof document !== 'undefined' && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  /**
   * On tab visibility regain, the next requestAnimationFrame timestamp can
   * jump by several seconds. Without a reset, the accumulator would queue
   * multiple MOVE_SNAKE dispatches in a single frame and the snake could
   * teleport into a wall. Cap the accumulator to a single tick to prevent
   * multi-tick jumps and unfair deaths (BUG-009 / BUG-010).
   */
  private handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') return;
    if (document.hidden) return;
    this.lastTick = 0;
    this.accumulator = 0;
  };

  private ensureVisibilityListener(): void {
    if (typeof document !== 'undefined' && !this.visibilityHandler) {
      this.visibilityHandler = () => this.handleVisibilityChange();
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }
}
