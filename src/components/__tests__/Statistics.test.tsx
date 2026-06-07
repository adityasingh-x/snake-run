import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Statistics } from '../Statistics';

describe('Statistics Component', () => {
  it('renders all four stat labels and values', () => {
    render(
      <Statistics gamesPlayed={10} totalFood={50} bestLevel={7} highScore={300} />
    );

    expect(screen.getByText('Games Played')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Total Food')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Best Level')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('High Score')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });
});
