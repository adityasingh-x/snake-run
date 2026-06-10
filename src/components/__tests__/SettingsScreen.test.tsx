import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SettingsScreen } from '../SettingsScreen';

describe('SettingsScreen', () => {
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders all settings sections', () => {
    render(<SettingsScreen onBack={mockBack} />);

    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Progress' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Statistics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Achievements' })).toBeInTheDocument();
  });

  it('navigates back when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows confirmation dialog when Reset Progress is clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Reset Progress' }));
    expect(screen.getByText('Reset all progress? This will erase your unlocked levels.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('cancels confirmation dialog on Cancel click', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Reset Progress' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Reset all progress?')).not.toBeInTheDocument();
  });

  it('clears localStorage on confirmed reset', async () => {
    localStorage.setItem('snakeLastUnlockedLevel', '5');
    const user = userEvent.setup();
    render(<SettingsScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Reset Progress' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(localStorage.getItem('snakeLastUnlockedLevel')).toBeNull();
  });

  it('cancels confirmation dialog on Escape key', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Reset Progress' }));
    expect(screen.getByText('Reset all progress? This will erase your unlocked levels.')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Reset all progress?')).not.toBeInTheDocument();
  });

  it('traps focus within the dialog: Shift+Tab on first element wraps to last', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Reset Progress' }));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(cancel).toHaveFocus();

    // Shift+Tab on first focusable (Cancel) should wrap to Confirm
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(confirm).toHaveFocus();
  });

  it('traps focus within the dialog: Tab on last element wraps to first', async () => {
    const user = userEvent.setup();
    render(<SettingsScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Reset Progress' }));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Confirm' });

    // Focus the last element
    confirm.focus();
    expect(confirm).toHaveFocus();

    // Tab on last should wrap to first
    await user.keyboard('{Tab}');
    expect(cancel).toHaveFocus();
  });
});
