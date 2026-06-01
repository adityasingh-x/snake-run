import { useEffect, useRef } from 'react';
import type { Direction, GameStatus } from '../types/game';
import { createKeyboardListener } from '../platform/keyboard';

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
  const listenerRef = useRef<ReturnType<typeof createKeyboardListener> | null>(null);

  useEffect(() => {
    listenerRef.current = createKeyboardListener({
      onStart,
      onPause,
      onResume,
      onRestart,
      onChangeDirection,
    });
    listenerRef.current.attach();

    return () => {
      listenerRef.current?.detach();
    };
  }, [onStart, onPause, onResume, onRestart, onChangeDirection]);

  useEffect(() => {
    listenerRef.current?.setDirection(currentDirection);
  }, [currentDirection]);

  useEffect(() => {
    listenerRef.current?.setStatus(status);
  }, [status]);
}
