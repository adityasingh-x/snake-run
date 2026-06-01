import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Cell } from '../Cell';
import '@testing-library/jest-dom';

describe('Cell Component', () => {
  it('renders a base cell correctly', () => {
    render(<Cell x={0} y={0} isSnakeHead={false} isSnakeBody={false} isFood={false} isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute('aria-label', 'Cell 0,0');
  });

  it('renders snake head with eyes', () => {
    render(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} isFood={false} isObstacle={false} direction="UP" />);
    const cell = screen.getByRole('gridcell');
    expect(cell).toHaveAttribute('aria-label', 'Snake head at 0,0');
    
    // Check if the eyes container is present
    const eyes = cell.querySelector('div');
    expect(eyes).toBeInTheDocument();
  });

  it('renders snake head with direction styling classes', () => {
    const { rerender } = render(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} isFood={false} isObstacle={false} direction="LEFT" />);
    let cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('snakeHead--left');

    rerender(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} isFood={false} isObstacle={false} direction="RIGHT" />);
    cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('snakeHead--right');
  });

  it('renders snake head with DOWN direction styling class', () => {
    render(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} isFood={false} isObstacle={false} direction="DOWN" />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('snakeHead--down');
  });
});
