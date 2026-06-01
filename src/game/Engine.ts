import type { GameState, GameAction, Direction } from './types';
import { getInitialState, gameReducer } from './state';
import { getLevelData } from './levels';
import { saveHighScore } from './storage';

export type GameEventListener = (state: GameState) => void;

export class Engine {
  private state: GameState;
  private listeners: Set<GameEventListener> = new Set();
  private rafId: number | null = null;
  private lastTick: number = 0;
  private accumulator: number = 0;

  constructor() {
    this.state = getInitialState();
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

    this.state = gameReducer(this.state, action);

    if (this.state.status === 'gameover' || this.state.status === 'won') {
      saveHighScore(this.state.score);
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
    this.dispatch({ type: 'START_GAME' });
    this.startLoop();
  }

  pause(): void {
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

  destroy(): void {
    this.stopLoop();
    this.listeners.clear();
  }
}
