import type { Direction } from '../game/types';

const SWIPE_THRESHOLD = 30;

export interface TouchHandler {
  onSwipe: (direction: Direction) => void;
}

export function createTouchListener(handler: TouchHandler) {
  let enabled = false;
  let element: HTMLElement | null = null;

  const handleTouchStart = (e: Event) => {
    const touch = (e as TouchEvent).touches[0];
    (e.currentTarget as HTMLElement).setAttribute(
      'data-touch-start',
      `${touch.clientX},${touch.clientY}`
    );
  };

  const handleTouchEnd = (e: Event) => {
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
      handler.onSwipe(deltaX > 0 ? 'RIGHT' : 'LEFT');
    } else {
      handler.onSwipe(deltaY > 0 ? 'DOWN' : 'UP');
    }
  };

  return {
    attach(el: HTMLElement, enabledFlag: boolean) {
      element = el;
      enabled = enabledFlag;
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
    },
    detach() {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        element = null;
      }
    },
    setEnabled(value: boolean) {
      enabled = value;
    },
  };
}
