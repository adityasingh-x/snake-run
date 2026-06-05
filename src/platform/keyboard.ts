import type { Direction, GameStatus } from '../game/types';
import { KEY_MAP, DIRECTION_OPPOSITE } from '../game/constants';

const PREVENT_DEFAULT_KEYS = new Set<string>([...Object.keys(KEY_MAP), ' ']);

export interface KeyboardHandler {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onContinue: () => void;
  onChangeDirection: (direction: Direction) => void;
}

export function createKeyboardListener(handler: KeyboardHandler) {
  let currentDirection: Direction = 'RIGHT';
  let currentStatus: GameStatus = 'idle';

  const handleKeyDown = (e: KeyboardEvent) => {
    if (PREVENT_DEFAULT_KEYS.has(e.key)) {
      e.preventDefault();
    }

    if (e.key === ' ') {
      if (currentStatus === 'idle') {
        handler.onStart();
      } else if (currentStatus === 'playing') {
        handler.onPause();
      } else if (currentStatus === 'paused') {
        handler.onResume();
      } else if (currentStatus === 'levelComplete') {
        handler.onContinue();
      } else if (currentStatus === 'gameover') {
        handler.onRestart();
      } else if (currentStatus === 'won') {
        handler.onRestart();
      }
      return;
    }

    const newDir = KEY_MAP[e.key];
    if (newDir && newDir !== DIRECTION_OPPOSITE[currentDirection]) {
      handler.onChangeDirection(newDir);
    }
  };

  return {
    attach() {
      window.addEventListener('keydown', handleKeyDown);
    },
    detach() {
      window.removeEventListener('keydown', handleKeyDown);
    },
    setDirection(dir: Direction) {
      currentDirection = dir;
    },
    setStatus(status: GameStatus) {
      currentStatus = status;
    },
  };
}
