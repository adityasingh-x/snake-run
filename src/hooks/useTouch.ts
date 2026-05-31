import { useEffect, useCallback } from 'react';
import type React from 'react';
import type { Direction } from '../types/game';

const SWIPE_THRESHOLD = 30;

interface UseTouchProps {
  onSwipe: (direction: Direction) => void;
  enabled: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
}

export function useTouch({ onSwipe, enabled, boardRef }: UseTouchProps) {
  const handleTouchStart = useCallback((e: Event) => {
    const touch = (e as TouchEvent).touches[0];
    (e.currentTarget as HTMLElement).setAttribute(
      'data-touch-start',
      `${touch.clientX},${touch.clientY}`
    );
  }, []);

  const handleTouchEnd = useCallback(
    (e: Event) => {
      if (!enabled) return;

      const startAttr = (e.currentTarget as HTMLElement).getAttribute(
        'data-touch-start'
      );
      if (!startAttr) return;

      const [startX, startY] = startAttr.split(',').map(Number);
      const touch = (e as TouchEvent).changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX < SWIPE_THRESHOLD && absDeltaY < SWIPE_THRESHOLD) return;

      if (absDeltaX > absDeltaY) {
        onSwipe(deltaX > 0 ? 'RIGHT' : 'LEFT');
      } else {
        onSwipe(deltaY > 0 ? 'DOWN' : 'UP');
      }
    },
    [onSwipe, enabled]
  );

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, boardRef]);
}
