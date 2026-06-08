import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PauseMenu } from '../PauseMenu';

describe('PauseMenu', () => {
  const mockResume = vi.fn();
  const mockRestart = vi.fn();
  const mockReturn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Resume, Restart Level, and Return to Menu buttons', () => {
    render(<PauseMenu onResume={mockResume} onRestartLevel={mockRestart} onReturnToMenu={mockReturn} />);

    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart Level' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return to Menu' })).toBeInTheDocument();
  });

  it('autoFocuses the Resume button', () => {
    render(<PauseMenu onResume={mockResume} onRestartLevel={mockRestart} onReturnToMenu={mockReturn} />);

    const resumeBtn = screen.getByRole('button', { name: 'Resume' });
    expect(resumeBtn).toHaveFocus();
  });

  it('calls onResume when Resume is clicked', async () => {
    const user = userEvent.setup();
    render(<PauseMenu onResume={mockResume} onRestartLevel={mockRestart} onReturnToMenu={mockReturn} />);

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(mockResume).toHaveBeenCalledTimes(1);
  });

  it('calls onRestartLevel when Restart Level is clicked', async () => {
    const user = userEvent.setup();
    render(<PauseMenu onResume={mockResume} onRestartLevel={mockRestart} onReturnToMenu={mockReturn} />);

    await user.click(screen.getByRole('button', { name: 'Restart Level' }));
    expect(mockRestart).toHaveBeenCalledTimes(1);
  });

  it('calls onReturnToMenu when Return to Menu is clicked', async () => {
    const user = userEvent.setup();
    render(<PauseMenu onResume={mockResume} onRestartLevel={mockRestart} onReturnToMenu={mockReturn} />);

    await user.click(screen.getByRole('button', { name: 'Return to Menu' }));
    expect(mockReturn).toHaveBeenCalledTimes(1);
  });
});
