import type { GameState, GameAction, Direction } from './types';
import { getInitialState, gameReducer } from './state';
import { POINTS_PER_FOOD } from './constants';
import { getLevelData } from './levels';
import { saveHighScore, saveLastUnlockedLevel } from './storage';
import { loadStats, saveStats } from './statistics';
import type { Stats } from './statistics';
import { checkAchievements, saveAchievement, loadAchievements } from './achievements';

export type GameEventListener = (state: GameState) => void;

export class Engine {
  private state: GameState;
  private listeners: Set<GameEventListener> = new Set();
  private rafId: number | null = null;
  private lastTick: number = 0;
  private accumulator: number = 0;
  private statsCache: Stats;
  // Engine-private tracker for the no_pause achievement; never read by UI or reducer.
  private wasPaused: boolean = false;
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
    const prevState = { ...this.state };

    if (action.type === 'START_GAME' || action.type === 'RESET' || action.type === 'START_ENDLESS_GAME') {
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

    if (this.state.score > prevScore) {
      const foodCount = (this.state.score - prevScore) / POINTS_PER_FOOD;
      this.statsCache.totalFood += foodCount;
    }

    if (this.state.level > prevLevel) {
      this.statsCache.bestLevel = Math.max(this.statsCache.bestLevel, this.state.level);
    }

    if (this.state.status === 'gameover' || this.state.status === 'won' || this.state.status === 'paused') {
      this.statsCache.highScore = this.state.highScore;
      saveStats(this.statsCache);
    }

    const newlyUnlocked = checkAchievements(this.state, prevState, this.wasPaused, this.unlockedAchievementIds);
    for (const id of newlyUnlocked) {
      saveAchievement(id);
      this.unlockedAchievementIds.add(id);
      this.onAchievementUnlock?.(id);
    }

    this.listeners.forEach(listener => listener(this.state));

    if (this.state.status === 'gameover' || this.state.status === 'won') {
      this.stopLoop();
    }

    if (this.state.score > prevScore) {
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
  }

  start(): void {
    this.wasPaused = false;
    this.dispatch({ type: 'START_GAME' });
    this.startLoop();
  }

  pause(): void {
    this.wasPaused = true;
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
    this.wasPaused = false;
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

  startEndless(): void {
    this.wasPaused = false;
    this.dispatch({ type: 'START_ENDLESS_GAME' });
    this.startLoop();
  }

  getStats(): Stats {
    return { ...this.statsCache, highScore: this.state.highScore };
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

      const config = getLevelData(this.state.level);
      const speed = config.speed ?? 150;

      if (this.accumulator >= speed) {
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
  onAchievementUnlock?: (id: string) => void;

  destroy(): void {
    this.stopLoop();
    this.listeners.clear();
  }
}
