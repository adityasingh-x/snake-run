import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RunnerGameOver } from '../RunnerGameOver';

describe('RunnerGameOver Component', () => {
  it('shows max multiplier stat', () => {
    render(
      <RunnerGameOver
        distance={100}
        foodEaten={5}
        snakeLength={8}
        highScore={200}
        score={150}
        maxMultiplier={1}
        onPlayAgain={vi.fn()}
        onReturnToMenu={vi.fn()}
      />
    );
    expect(screen.getByText('Max Multiplier')).toBeInTheDocument();
    expect(screen.getByText('x1')).toBeInTheDocument();
  });

  it('shows next milestone when not at max tier', () => {
    render(
      <RunnerGameOver
        distance={300}
        foodEaten={12}
        snakeLength={15}
        highScore={500}
        score={400}
        maxMultiplier={2}
        onPlayAgain={vi.fn()}
        onReturnToMenu={vi.fn()}
      />
    );
    expect(screen.getByText('Next Milestone')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('hides next milestone at length 50+', () => {
    render(
      <RunnerGameOver
        distance={1000}
        foodEaten={50}
        snakeLength={55}
        highScore={2000}
        score={1500}
        maxMultiplier={5}
        onPlayAgain={vi.fn()}
        onReturnToMenu={vi.fn()}
      />
    );
    expect(screen.queryByText('Next Milestone')).not.toBeInTheDocument();
  });

  it('shows next milestone for length 35', () => {
    render(
      <RunnerGameOver
        distance={800}
        foodEaten={35}
        snakeLength={35}
        highScore={1200}
        score={1100}
        maxMultiplier={4}
        onPlayAgain={vi.fn()}
        onReturnToMenu={vi.fn()}
      />
    );
    expect(screen.getByText('Next Milestone')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('shows max multiplier x3', () => {
    render(
      <RunnerGameOver
        distance={500}
        foodEaten={20}
        snakeLength={22}
        highScore={800}
        score={700}
        maxMultiplier={3}
        onPlayAgain={vi.fn()}
        onReturnToMenu={vi.fn()}
      />
    );
    expect(screen.getByText('x3')).toBeInTheDocument();
  });
});
