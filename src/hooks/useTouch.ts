import { useEffect, useRef } from 'react';
import type React from 'react';
import type { Direction } from '../types/game';
import { createTouchListener } from '../platform/touch';

interface UseTouchProps {
  onSwipe: (direction: Direction) => void;
  enabled: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
}

export function useTouch({ onSwipe, enabled, boardRef }: UseTouchProps) {
  const listenerRef = useRef<ReturnType<typeof createTouchListener> | null>(null);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    listenerRef.current = createTouchListener({ onSwipe });
    listenerRef.current.attach(el, enabled);

    return () => {
      listenerRef.current?.detach();
    };
  }, [onSwipe, boardRef, enabled]);

  useEffect(() => {
    listenerRef.current?.setEnabled(enabled);
  }, [enabled]);
}
