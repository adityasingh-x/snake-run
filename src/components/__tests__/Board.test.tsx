import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Board } from '../Board';
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
