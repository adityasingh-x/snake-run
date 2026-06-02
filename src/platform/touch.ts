import type { Direction } from '../game/types';

export interface SwipeEvent {
  direction: Direction;
  distance: number;
}

export interface SwipeProgress {
  candidate: Direction | null;
  progress: number;
}

export interface GestureRecognizerOptions {
  onSwipe: (e: SwipeEvent) => void;
  onProgress?: (e: SwipeProgress) => void;
  lockThreshold?: number;
  triggerThreshold?: number;
  axisRatio?: number;
  cooldownMs?: number;
}

export interface GestureRecognizer {
  attach(el: HTMLElement, enabled: boolean): void;
  detach(): void;
  setEnabled(value: boolean): void;
}

export function createGestureRecognizer(
  opts: GestureRecognizerOptions
): GestureRecognizer {
  const {
    onSwipe,
    onProgress,
    lockThreshold = 24,
    triggerThreshold = 36,
    axisRatio = 1.5,
    cooldownMs = 80,
  } = opts;

  let enabled = false;
  let element: HTMLElement | null = null;

  let startX = 0;
  let startY = 0;
  let isTracking = false;
  let lockedAxis: 'horizontal' | 'vertical' | null = null;
  let lastSwipeTime = 0;

  const getDirection = (
    dx: number,
    dy: number
  ): { axis: 'horizontal' | 'vertical'; direction: Direction } => {
    if (Math.abs(dx) > Math.abs(dy)) {
      return {
        axis: 'horizontal',
        direction: dx > 0 ? 'RIGHT' : 'LEFT',
      };
    }
    return {
      axis: 'vertical',
      direction: dy > 0 ? 'DOWN' : 'UP',
    };
  };

  const handleTouchStart = (e: Event) => {
    if (!enabled) return;
    const touch = (e as TouchEvent).touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isTracking = true;
    lockedAxis = null;
  };

  const handleTouchMove = (e: Event) => {
    if (!enabled || !isTracking) return;

    const touch = (e as TouchEvent).touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (!lockedAxis && absDx + absDy > lockThreshold) {
      lockedAxis = absDx > absDy ? 'horizontal' : 'vertical';
    }

    if (lockedAxis && onProgress) {
      const isHorizontalAxis = lockedAxis === 'horizontal';
      const distance = isHorizontalAxis ? absDx : absDy;
      const progress = Math.min(distance / triggerThreshold, 1);
      const direction = isHorizontalAxis
        ? dx > 0
          ? 'RIGHT'
          : 'LEFT'
        : dy > 0
          ? 'DOWN'
          : 'UP';
      onProgress({ candidate: direction, progress });
    }
  };

  const handleTouchEnd = (e: Event) => {
    if (!enabled || !isTracking) return;

    const now = Date.now();
    const touch = (e as TouchEvent).changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    isTracking = false;

    if (!lockedAxis) {
      return;
    }

    const { direction } = getDirection(dx, dy);
    const isHorizontal = lockedAxis === 'horizontal';
    const distance = isHorizontal ? absDx : absDy;

    const axisSatisfied = isHorizontal
      ? absDx > absDy * axisRatio
      : absDy > absDx * axisRatio;

    if (distance >= triggerThreshold && axisSatisfied) {
      if (now - lastSwipeTime >= cooldownMs) {
        lastSwipeTime = now;
        onSwipe({ direction, distance });
      }
    }

    lockedAxis = null;
  };

  const handleTouchCancel = () => {
    isTracking = false;
    lockedAxis = null;
  };

  return {
    attach(el: HTMLElement, enabledFlag: boolean) {
      element = el;
      enabled = enabledFlag;
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchmove', handleTouchMove, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
      el.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    },
    detach() {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchCancel);
        element = null;
      }
    },
    setEnabled(value: boolean) {
      enabled = value;
      if (!value) {
        isTracking = false;
        lockedAxis = null;
      }
    },
  };
}
