import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StatisticsScreen } from '../StatisticsScreen';

describe('StatisticsScreen', () => {
  const mockBack = vi.fn();

  it('renders stats passed as props', () => {
    render(
      <StatisticsScreen
        stats={{ gamesPlayed: 10, totalFood: 50, bestLevel: 4, highScore: 300 }}
        onBack={mockBack}
      />
    );

    expect(screen.getByText('Games Played')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Total Food')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Best Level')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('High Score')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('navigates back when Back is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StatisticsScreen
        stats={{ gamesPlayed: 0, totalFood: 0, bestLevel: 1, highScore: 0 }}
        onBack={mockBack}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
