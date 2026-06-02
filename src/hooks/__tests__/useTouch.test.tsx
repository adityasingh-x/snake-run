import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { useTouch } from '../useTouch';

const TestComponent = ({
  onSwipe,
  enabled,
}: {
  onSwipe: (direction: string) => void;
  enabled: boolean;
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  useTouch({ onSwipe, enabled, boardRef });

  return (
    <div ref={boardRef} data-testid="board">
      Test Board
    </div>
  );
};

describe('useTouch', () => {
  it('calls onSwipe callback on successful swipe', () => {
    const onSwipe = vi.fn();
    const { getByTestId } = render(
      <TestComponent onSwipe={onSwipe} enabled={true} />
    );

    const board = getByTestId('board');

    fireEvent.touchStart(board, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchMove(board, {
      touches: [{ clientX: 150, clientY: 100 }],
    });
    fireEvent.touchEnd(board, {
      changedTouches: [{ clientX: 150, clientY: 100 }],
    });

    expect(onSwipe).toHaveBeenCalledWith('RIGHT');
  });

  it('blocks swipes when enabled is false', () => {
    const onSwipe = vi.fn();
    const { getByTestId } = render(
      <TestComponent onSwipe={onSwipe} enabled={false} />
    );

    const board = getByTestId('board');

    fireEvent.touchStart(board, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchMove(board, {
      touches: [{ clientX: 150, clientY: 100 }],
    });
    fireEvent.touchEnd(board, {
      changedTouches: [{ clientX: 150, clientY: 100 }],
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });
});
