import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { HelpScreen } from '../HelpScreen';

describe('HelpScreen', () => {
  const mockBack = vi.fn();

  it('renders all mechanics sections', () => {
    render(<HelpScreen onBack={mockBack} />);

    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Food Types')).toBeInTheDocument();
    expect(screen.getByText('Special Mechanics')).toBeInTheDocument();
    expect(screen.getByText('Progression')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('navigates back when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<HelpScreen onBack={mockBack} />);

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
