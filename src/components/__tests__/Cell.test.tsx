import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Cell } from '../Cell';
import '@testing-library/jest-dom';

describe('Cell Component', () => {
  it('renders a base cell correctly', () => {
    render(<Cell x={0} y={0} isSnakeHead={false} isSnakeBody={false} foodType={undefined} isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute('aria-label', 'Cell 0,0');
  });

  it('renders snake head with eyes', () => {
    render(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} foodType={undefined} isObstacle={false} direction="UP" />);
    const cell = screen.getByRole('gridcell');
    expect(cell).toHaveAttribute('aria-label', 'Snake head at 0,0');
    
    // Check if the eyes container is present
    const eyes = cell.querySelector('div');
    expect(eyes).toBeInTheDocument();
  });

  it('renders snake head with direction styling classes', () => {
    const { rerender } = render(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} foodType={undefined} isObstacle={false} direction="LEFT" />);
    let cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('snakeHead--left');

    rerender(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} foodType={undefined} isObstacle={false} direction="RIGHT" />);
    cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('snakeHead--right');
  });

  it('renders snake head with DOWN direction styling class', () => {
    render(<Cell x={0} y={0} isSnakeHead={true} isSnakeBody={false} foodType={undefined} isObstacle={false} direction="DOWN" />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('snakeHead--down');
  });

  it('renders gold food with diamond styling', () => {
    render(<Cell x={5} y={5} isSnakeHead={false} isSnakeBody={false} foodType="gold" isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('gold');
    expect(cell).toHaveAttribute('aria-label', 'Gold food at 5,5');
  });

  it('renders poison food with square styling', () => {
    render(<Cell x={5} y={5} isSnakeHead={false} isSnakeBody={false} foodType="poison" isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('poison');
    expect(cell).toHaveAttribute('aria-label', 'Poison food at 5,5');
  });

  it('renders slow food with triangle styling', () => {
    render(<Cell x={5} y={5} isSnakeHead={false} isSnakeBody={false} foodType="slow" isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('slow');
    expect(cell).toHaveAttribute('aria-label', 'Slow food at 5,5');
  });

  it('renders normal food with circle styling', () => {
    render(<Cell x={5} y={5} isSnakeHead={false} isSnakeBody={false} foodType="normal" isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('food');
    expect(cell).toHaveAttribute('aria-label', 'Food at 5,5');
  });

  it('renders portal with rotation styling', () => {
    render(<Cell x={2} y={4} isSnakeHead={false} isSnakeBody={false} foodType={undefined} isObstacle={false} isPortal={true} />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).toContain('portal');
    expect(cell).toHaveAttribute('aria-label', 'Portal at 2,4');
  });
});

describe('Cell — runner lane styling', () => {
  it('applies nonLaneColumn class for non-lane columns', () => {
    render(<Cell x={0} y={0} isSnakeHead={false} isSnakeBody={false}
      foodType={undefined} isObstacle={false} isLaneColumn={false} />);
    expect(screen.getByRole('gridcell').className).toContain('nonLaneColumn');
  });

  it('applies activeLane class when isActiveLane is true', () => {
    render(<Cell x={10} y={0} isSnakeHead={false} isSnakeBody={false}
      foodType={undefined} isObstacle={false} isLaneColumn={true} isActiveLane={true} />);
    expect(screen.getByRole('gridcell').className).toContain('activeLane');
  });

  it('does not apply nonLaneColumn when isLaneColumn is undefined (classic mode)', () => {
    render(<Cell x={0} y={0} isSnakeHead={false} isSnakeBody={false}
      foodType={undefined} isObstacle={false} />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).not.toContain('nonLaneColumn');
  });
});

describe('Cell — lane change direction', () => {
  it('applies laneSlidingLeft class for left lane change on snake head', () => {
    render(<Cell x={10} y={0} isSnakeHead={true} isSnakeBody={false}
      foodType={undefined} isObstacle={false} direction="UP" laneChangeDirection="left" />);
    expect(screen.getByRole('gridcell').className).toContain('laneSlidingLeft');
  });

  it('applies laneSlidingRight class for right lane change on snake head', () => {
    render(<Cell x={10} y={0} isSnakeHead={true} isSnakeBody={false}
      foodType={undefined} isObstacle={false} direction="UP" laneChangeDirection="right" />);
    expect(screen.getByRole('gridcell').className).toContain('laneSlidingRight');
  });

  it('does not apply lane change class on non-head cells', () => {
    render(<Cell x={10} y={0} isSnakeHead={false} isSnakeBody={true}
      foodType={undefined} isObstacle={false} laneChangeDirection="left" />);
    const cell = screen.getByRole('gridcell');
    expect(cell.className).not.toContain('laneSlidingLeft');
    expect(cell.className).not.toContain('laneSlidingRight');
  });

  it('applies cellScrolling class when isViewportScrolling is true', () => {
    render(<Cell x={10} y={0} isSnakeHead={false} isSnakeBody={false}
      foodType={undefined} isObstacle={false} isViewportScrolling={true} />);
    expect(screen.getByRole('gridcell').className).toContain('cellScrolling');
  });
});
