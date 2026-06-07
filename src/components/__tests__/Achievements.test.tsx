import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Achievements } from '../Achievements';
import type { Achievement } from '../../game/achievements';

const mockAchievements: Achievement[] = [
  { id: 'beat_game', name: 'Snake Master', description: 'Complete level 10', unlocked: true },
  { id: 'score_500', name: 'High Scorer', description: 'Reach score 500', unlocked: false },
  { id: 'no_pause', name: 'Marathon Run', description: 'Win without pausing', unlocked: false },
];

describe('Achievements Component', () => {
  it('renders all three achievements with correct locked/unlocked state', () => {
    render(<Achievements achievements={mockAchievements} />);

    expect(screen.getByText('Snake Master')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getAllByText('???')).toHaveLength(2);
  });

  it('unlocked achievements show their name; locked achievements show placeholder', () => {
    render(<Achievements achievements={mockAchievements} />);

    expect(screen.getByText('Snake Master')).toBeInTheDocument();
    const placeholders = screen.getAllByText('???');
    expect(placeholders).toHaveLength(2);
  });

  it('renders the NEW badge on achievements whose IDs are in newAchievementIds', () => {
    render(<Achievements achievements={mockAchievements} newAchievementIds={['beat_game']} />);

    expect(screen.getByText('NEW')).toBeInTheDocument();
  });
});
