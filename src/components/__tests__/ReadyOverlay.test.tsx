import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ReadyOverlay } from '../ReadyOverlay';

describe('ReadyOverlay', () => {
  const mockStart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders level name, description, and objective', () => {
    render(
      <ReadyOverlay
        startLevel={3}
        levelName="Split Paths"
        levelDescription="Choose your path between the walls."
        levelObjective="Eat 14 food to complete this level."
        onStart={mockStart}
      />
    );

    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('Split Paths')).toBeInTheDocument();
    expect(screen.getByText('Choose your path between the walls.')).toBeInTheDocument();
    expect(screen.getByText('Eat 14 food to complete this level.')).toBeInTheDocument();
  });

  it('Start button is auto-focused', () => {
    render(
      <ReadyOverlay
        startLevel={1}
        levelName="First Meal"
        levelDescription="Learn to move and collect food."
        levelObjective="Eat 10 food to complete this level."
        onStart={mockStart}
      />
    );

    expect(screen.getByRole('button', { name: 'Start' })).toHaveFocus();
  });

  it('calls onStart when Start button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReadyOverlay
        startLevel={1}
        levelName="First Meal"
        levelDescription="Learn to move and collect food."
        levelObjective="Eat 10 food to complete this level."
        onStart={mockStart}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
