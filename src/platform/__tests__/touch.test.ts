import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGestureRecognizer } from '../touch';
import type { SwipeEvent, SwipeProgress } from '../touch';

interface FakeElement {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
  getAttribute: ReturnType<typeof vi.fn>;
  getListeners: () => Record<string, ((e: Event) => void)[]>;
}

const createFakeElement = (): FakeElement => {
  const listeners: Record<string, ((e: Event) => void)[]> = {};
  return {
    addEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    }),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    getListeners: () => listeners,
  };
};

const createTouchEvent = (
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  clientX: number,
  clientY: number
): TouchEvent => {
  const touch = {
    clientX,
    clientY,
    identifier: 0,
    target: null,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  };

  return {
    type,
    touches: type === 'touchend' || type === 'touchcancel' ? [] : [touch],
    changedTouches: [touch],
    targetTouches: type === 'touchend' || type === 'touchcancel' ? [] : [touch],
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as TouchEvent;
};

const dispatchToAll = (
  listeners: Record<string, ((e: Event) => void)[]>,
  event: string,
  data: TouchEvent
) => {
  listeners[event]?.forEach(handler => handler(data));
};

describe('createGestureRecognizer', () => {
  let onSwipe: (e: SwipeEvent) => void;
  let onProgress: (e: SwipeProgress) => void;
  let element: FakeElement;
  let recognizer: ReturnType<typeof createGestureRecognizer>;

  beforeEach(() => {
    onSwipe = vi.fn();
    onProgress = vi.fn();
    element = createFakeElement();
    recognizer = createGestureRecognizer({ onSwipe, onProgress });
    recognizer.attach(element as unknown as HTMLElement, true);
  });

  it('does NOT fire on a short tap', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 110, 110));

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('fires RIGHT for a horizontal swipe with sufficient distance', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 150, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 150, 100));

    expect(onSwipe).toHaveBeenCalledWith({
      direction: 'RIGHT',
      distance: 50,
    });
  });

  it('fires LEFT for a horizontal swipe to the left', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 150, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 100, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 100, 100));

    expect(onSwipe).toHaveBeenCalledWith({
      direction: 'LEFT',
      distance: 50,
    });
  });

  it('fires DOWN for a vertical swipe downward', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 100, 150));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 100, 150));

    expect(onSwipe).toHaveBeenCalledWith({
      direction: 'DOWN',
      distance: 50,
    });
  });

  it('fires UP for a vertical swipe upward', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 150));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 100, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 100, 100));

    expect(onSwipe).toHaveBeenCalledWith({
      direction: 'UP',
      distance: 50,
    });
  });

  it('does NOT fire on a diagonal swipe with low axis ratio', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 140, 130));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 140, 130));

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('does NOT fire after touchcancel', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 150, 100));
    dispatchToAll(listeners, 'touchcancel', createTouchEvent('touchcancel', 150, 100));

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('suppresses second swipe within cooldown', () => {
    const listeners = element.getListeners();

    // First swipe
    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 150, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 150, 100));

    expect(onSwipe).toHaveBeenCalledTimes(1);

    // Second swipe immediately after
    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 150, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 150, 100));

    // Should still be 1 call due to cooldown
    expect(onSwipe).toHaveBeenCalledTimes(1);
  });

  it('blocks swipes when disabled', () => {
    recognizer.setEnabled(false);
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 150, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 150, 100));

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('calls onProgress with correct candidate and progress', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 136, 100));

    expect(onProgress).toHaveBeenCalledWith({
      candidate: 'RIGHT',
      progress: expect.closeTo(1.0, 1),
    });
  });

  it('does NOT fire if distance is below triggerThreshold', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 130, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 130, 100));

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('fires only once per gesture', () => {
    const listeners = element.getListeners();

    dispatchToAll(listeners, 'touchstart', createTouchEvent('touchstart', 100, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 150, 100));
    dispatchToAll(listeners, 'touchmove', createTouchEvent('touchmove', 200, 100));
    dispatchToAll(listeners, 'touchend', createTouchEvent('touchend', 200, 100));

    expect(onSwipe).toHaveBeenCalledTimes(1);
  });
});
