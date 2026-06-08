import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MainMenu } from '../MainMenu';

describe('MainMenu', () => {
  const mockNavigate = vi.fn();
  const mockStartGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all menu options', () => {
    render(<MainMenu lastUnlockedLevel={1} highScore={0} onNavigate={mockNavigate} onStartGame={mockStartGame} />);

    expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Achievements' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
  });

  it('shows Continue when there is progress', () => {
    render(<MainMenu lastUnlockedLevel={3} highScore={100} onNavigate={mockNavigate} onStartGame={mockStartGame} />);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByText('Continue Level 3')).toBeInTheDocument();
    expect(screen.getByText('High Score: 100')).toBeInTheDocument();
  });

  it('does not show Continue when no progress', () => {
    render(<MainMenu lastUnlockedLevel={1} highScore={0} onNavigate={mockNavigate} onStartGame={mockStartGame} />);

    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('calls onStartGame with lastUnlockedLevel when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(<MainMenu lastUnlockedLevel={3} highScore={100} onNavigate={mockNavigate} onStartGame={mockStartGame} />);

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(mockStartGame).toHaveBeenCalledWith(3);
  });

  it('calls onStartGame with level 1 when New Game is clicked', async () => {
    const user = userEvent.setup();
    render(<MainMenu lastUnlockedLevel={1} highScore={0} onNavigate={mockNavigate} onStartGame={mockStartGame} />);

    await user.click(screen.getByRole('button', { name: 'New Game' }));
    expect(mockStartGame).toHaveBeenCalledWith(1);
  });

  it('calls onNavigate for other menu items', async () => {
    const user = userEvent.setup();
    render(<MainMenu lastUnlockedLevel={1} highScore={0} onNavigate={mockNavigate} onStartGame={mockStartGame} />);

    await user.click(screen.getByRole('button', { name: 'Statistics' }));
    expect(mockNavigate).toHaveBeenCalledWith('statistics');

    await user.click(screen.getByRole('button', { name: 'Achievements' }));
    expect(mockNavigate).toHaveBeenCalledWith('achievements');

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(mockNavigate).toHaveBeenCalledWith('settings');

    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(mockNavigate).toHaveBeenCalledWith('help');
  });
});
