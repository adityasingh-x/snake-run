import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LevelTransition } from '../LevelTransition';

describe('LevelTransition Component', () => {
  const defaultProps = {
    completedLevelId: 1,
    completedLevelName: 'First Steps',
    nextLevelName: 'Tight Spaces',
    nextLevelDescription: 'Navigate around the growing obstacles.',
    score: 50,
    onContinue: vi.fn(),
  };

  it('renders completed level info', () => {
    render(<LevelTransition {...defaultProps} />);
    expect(screen.getByText('Level 1 Complete')).toBeInTheDocument();
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('renders next level info', () => {
    render(<LevelTransition {...defaultProps} />);
    expect(screen.getByText('Next: Tight Spaces')).toBeInTheDocument();
    expect(screen.getByText('Navigate around the growing obstacles.')).toBeInTheDocument();
  });

  it('renders score', () => {
    render(<LevelTransition {...defaultProps} />);
    expect(screen.getByText('Score: 50')).toBeInTheDocument();
  });

  it('calls onContinue when button is clicked', async () => {
    const user = userEvent.setup();
    render(<LevelTransition {...defaultProps} />);
    const button = screen.getByRole('button', { name: /continue to next level/i });
    await user.click(button);
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    render(<LevelTransition {...defaultProps} />);
    const button = screen.getByRole('button', { name: /continue to next level/i });
    expect(button).toHaveAttribute('aria-label', 'Continue to next level');
  });
});
