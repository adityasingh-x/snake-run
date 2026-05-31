import { useEffect, useRef } from 'react';
import type { Direction, GameStatus } from '../types/game';
import { KEY_MAP, DIRECTION_OPPOSITE } from '../utils/constants';

interface UseKeyboardProps {
  status: GameStatus;
  currentDirection: Direction;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onChangeDirection: (direction: Direction) => void;
}

export function useKeyboard({
  status,
  currentDirection,
  onStart,
  onPause,
  onResume,
  onRestart,
  onChangeDirection,
}: UseKeyboardProps) {
  const directionRef = useRef(currentDirection);
  const statusRef = useRef(status);

  useEffect(() => {
    directionRef.current = currentDirection;
  }, [currentDirection]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
         'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' '].includes(
          e.key
        )
      ) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (statusRef.current === 'idle') {
          onStart();
        } else if (statusRef.current === 'playing') {
          onPause();
        } else if (statusRef.current === 'paused') {
          onResume();
        } else if (statusRef.current === 'gameover') {
          onRestart();
        } else if (statusRef.current === 'won') {
          onRestart();
        }
        return;
      }

      const newDir = KEY_MAP[e.key];
      if (newDir && newDir !== DIRECTION_OPPOSITE[directionRef.current]) {
        onChangeDirection(newDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, onPause, onResume, onRestart, onChangeDirection]);
}
