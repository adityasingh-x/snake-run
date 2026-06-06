import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { GameOver } from '../GameOver';

describe('GameOver Component', () => {
  it('renders single "Play Again" button when lastUnlockedLevel === 1', () => {
    render(
      <GameOver
        score={100}
        onRestart={vi.fn()}
        onContinueFromLevel={vi.fn()}
        lastUnlockedLevel={1}
      />
    );
    expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new game/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue from level/i })).not.toBeInTheDocument();
  });

  it('renders "Continue from Level N" and "New Game" buttons when lastUnlockedLevel > 1', () => {
    render(
      <GameOver
        score={200}
        onRestart={vi.fn()}
        onContinueFromLevel={vi.fn()}
        lastUnlockedLevel={5}
      />
    );
    expect(screen.getByRole('button', { name: /continue from level 5/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /play again/i })).not.toBeInTheDocument();
  });

  it('"Continue" button calls onContinueFromLevel with correct level', async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(
      <GameOver
        score={200}
        onRestart={vi.fn()}
        onContinueFromLevel={onContinue}
        lastUnlockedLevel={7}
      />
    );
    await user.click(screen.getByRole('button', { name: /continue from level 7/i }));
    expect(onContinue).toHaveBeenCalledWith(7);
  });

  it('"New Game" button calls onRestart', async () => {
    const onRestart = vi.fn();
    const user = userEvent.setup();
    render(
      <GameOver
        score={200}
        onRestart={onRestart}
        onContinueFromLevel={vi.fn()}
        lastUnlockedLevel={3}
      />
    );
    await user.click(screen.getByRole('button', { name: /new game/i }));
    expect(onRestart).toHaveBeenCalled();
  });

  it('win variant still works with both layouts', () => {
    const { rerender } = render(
      <GameOver
        score={500}
        onRestart={vi.fn()}
        onContinueFromLevel={vi.fn()}
        lastUnlockedLevel={1}
        variant="win"
      />
    );
    expect(screen.getByText(/you win!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();

    rerender(
      <GameOver
        score={500}
        onRestart={vi.fn()}
        onContinueFromLevel={vi.fn()}
        lastUnlockedLevel={4}
        variant="win"
      />
    );
    expect(screen.getByText(/you win!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue from level 4/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
  });
});
