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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enabled is intentionally toggled via setEnabled in the effect below to avoid listener churn
  }, [onSwipe, boardRef]);

  useEffect(() => {
    listenerRef.current?.setEnabled(enabled);
  }, [enabled]);
}
