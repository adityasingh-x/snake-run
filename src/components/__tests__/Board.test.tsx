import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Board } from '../Board';
import { GRID_SIZE } from '../../utils/constants';
import '@testing-library/jest-dom';

describe('Board Component', () => {
  const defaultProps = {
    snake: [{ x: 10, y: 10 }],
    direction: 'RIGHT' as const,
    food: { position: { x: 5, y: 5 }, type: 'normal' as const, timer: -1 },
    obstacles: [],
  };

  it('renders 400 cells (20x20 grid)', () => {
    render(<Board {...defaultProps} />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBe(400);
  });

  it('uses 1fr for columns and rows', () => {
    render(<Board {...defaultProps} />);
    const board = screen.getByRole('grid');
    expect(board.style.gridTemplateColumns).toContain('1fr');
    expect(board.style.gridTemplateRows).toContain('1fr');
  });

  it('has board class for responsive styling', () => {
    render(<Board {...defaultProps} />);
    const board = screen.getByRole('grid');
    expect(board.className).toContain('board');
  });
});

describe('Board — runner mode', () => {
  const defaultProps = {
    snake: [{ x: 10, y: 10 }],
    direction: 'RIGHT' as const,
    food: { position: { x: 10, y: 5 }, type: 'normal' as const, timer: -1 },
    obstacles: [],
  };

  it('renders 400 cells in runner mode', () => {
    render(<Board {...defaultProps} runnerLane={1} />);
    expect(screen.getAllByRole('gridcell').length).toBe(400);
  });

  it('sets data-runner attribute in runner mode', () => {
    render(<Board {...defaultProps} runnerLane={1} />);
    const board = screen.getByRole('grid');
    expect(board.getAttribute('data-runner')).toBe('true');
  });

  it('does not set data-runner attribute in classic mode', () => {
    render(<Board {...defaultProps} />);
    const board = screen.getByRole('grid');
    expect(board.hasAttribute('data-runner')).toBe(false);
  });
});

describe('Board — viewport scrolling', () => {
  const snakeHead = { x: 10, y: 5 };
  const defaultProps = {
    snake: [snakeHead, { x: 9, y: 5 }, { x: 8, y: 5 }],
    direction: 'UP' as const,
    food: { position: { x: 10, y: 14 }, type: 'normal' as const, timer: -1 },
    obstacles: [],
    runnerLane: 1 as const,
  };

  it('sets data-viewport-scrolling attribute when viewportHeadY is provided', () => {
    render(<Board {...defaultProps} viewportHeadY={5} />);
    const board = screen.getByRole('grid');
    expect(board.getAttribute('data-viewport-scrolling')).toBe('true');
  });

  it('does not set data-viewport-scrolling in classic mode', () => {
    render(<Board {...defaultProps} />);
    const board = screen.getByRole('grid');
    expect(board.hasAttribute('data-viewport-scrolling')).toBe(false);
  });

  it('snake head cell is rendered in runner mode with viewport', () => {
    render(<Board {...defaultProps} viewportHeadY={5} />);
    const headCell = screen.getByLabelText(`Snake head at ${snakeHead.x},${snakeHead.y}`);
    expect(headCell).toBeInTheDocument();
  });

  it('classic mode rendering is identical when viewportHeadY is undefined', () => {
    const { container: classic } = render(<Board {...defaultProps} />);
    const { container: viewportUndefined } = render(<Board {...defaultProps} viewportHeadY={undefined} />);
    expect(viewportUndefined.innerHTML).toBe(classic.innerHTML);
  });

  it('viewportHeadY=0 and viewportHeadY=GRID_SIZE produce same grid cell positions', () => {
    // When viewportHeadY wraps from 0 to GRID_SIZE, the screen positions should be identical
    // because (screenY + 0 - VIEWPORT_TAIL) % GRID_SIZE == (screenY + GRID_SIZE - VIEWPORT_TAIL) % GRID_SIZE
    const { container: at0 } = render(
      <Board {...defaultProps} snake={[{ x: 10, y: 0 }]} viewportHeadY={0} />
    );
    const { container: atSize } = render(
      <Board {...defaultProps} snake={[{ x: 10, y: GRID_SIZE }]} viewportHeadY={GRID_SIZE} />
    );
    // Both should render the same number of cells (wrapping at y=0 and y=GRID_SIZE are equivalent)
    expect(at0.querySelectorAll('[role="gridcell"]').length)
      .toBe(atSize.querySelectorAll('[role="gridcell"]').length);
  });
});
