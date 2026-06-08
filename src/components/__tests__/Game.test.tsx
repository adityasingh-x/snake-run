import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

vi.mock('../../hooks/useGame');
vi.mock('../../hooks/useKeyboard');
vi.mock('../../hooks/useTouch');
vi.mock('../../platform/sound', () => ({
  sharedSoundManager: {
    isEnabled: vi.fn(() => true),
    toggleSound: vi.fn(() => false),
    initAudio: vi.fn(),
    playEat: vi.fn(),
    playCollision: vi.fn(),
    playLevelUp: vi.fn(),
  },
}));

import { useGame } from '../../hooks/useGame';
import { Game } from '../Game';

const mockUseGame = vi.mocked(useGame);

const makePlayingState = () => ({
  snake: [{ x: 10, y: 10 }],
  food: { position: { x: 5, y: 5 }, type: 'normal' as const, timer: -1 },
  direction: 'RIGHT' as const,
  nextDirection: 'RIGHT' as const,
  status: 'playing' as const,
  score: 0,
  highScore: 0,
  level: 1,
  obstacles: [],
  lastUnlockedLevel: 1,
  foodEaten: 0,
  isEndless: false,
  speedEffectTicks: 0,
});

const makeIdleState = () => ({
  ...makePlayingState(),
  status: 'idle' as const,
});

describe('Game Component', () => {
  const mockPauseGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGame.mockReturnValue({
      state: makePlayingState(),
      stats: { gamesPlayed: 0, totalFood: 0, bestLevel: 1, highScore: 0 },
      achievements: [],
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: vi.fn(),
      startEndlessGame: vi.fn(),
      pauseGame: mockPauseGame,
      resumeGame: vi.fn(),
      changeDirection: vi.fn(),
      resetGame: vi.fn(),
      continueGame: vi.fn(),
    });
  });

  it('renders pause button when game is playing', () => {
    render(<Game />);
    const pauseButton = screen.getByRole('button', { name: /pause game/i });
    expect(pauseButton).toBeInTheDocument();
  });

  it('pause button is not rendered when game is idle', () => {
    mockUseGame.mockReturnValue({
      state: makeIdleState(),
      stats: { gamesPlayed: 0, totalFood: 0, bestLevel: 1, highScore: 0 },
      achievements: [],
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: vi.fn(),
      startEndlessGame: vi.fn(),
      pauseGame: mockPauseGame,
      resumeGame: vi.fn(),
      changeDirection: vi.fn(),
      resetGame: vi.fn(),
      continueGame: vi.fn(),
    });

    render(<Game />);
    expect(screen.queryByRole('button', { name: /pause game/i })).not.toBeInTheDocument();
  });

  it('calls pauseGame when pause button is clicked', async () => {
    const user = userEvent.setup();
    render(<Game />);
    const pauseButton = screen.getByRole('button', { name: /pause game/i });
    await user.click(pauseButton);
    expect(mockPauseGame).toHaveBeenCalledTimes(1);
  });

  it('renders dev level select and calls startGameAtLevel on Go click', async () => {
    const mockStartAtLevel = vi.fn();
    mockUseGame.mockReturnValue({
      state: makeIdleState(),
      stats: { gamesPlayed: 0, totalFood: 0, bestLevel: 1, highScore: 0 },
      achievements: [],
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: mockStartAtLevel,
      startEndlessGame: vi.fn(),
      pauseGame: vi.fn(),
      resumeGame: vi.fn(),
      changeDirection: vi.fn(),
      resetGame: vi.fn(),
      continueGame: vi.fn(),
    });

    const user = userEvent.setup();
    render(<Game />);

    const select = screen.getByRole('combobox', { name: 'Developer level select' });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('1');

    await user.selectOptions(select, '5');
    expect(select).toHaveValue('5');

    const goButton = screen.getByRole('button', { name: 'Go' });
    await user.click(goButton);
    expect(mockStartAtLevel).toHaveBeenCalledWith(5);
  });

  it('renders Statistics and Achievements panels on idle screen', () => {
    mockUseGame.mockReturnValue({
      state: makeIdleState(),
      stats: { gamesPlayed: 5, totalFood: 42, bestLevel: 3, highScore: 200 },
      achievements: [
        { id: 'beat_game', name: 'Snake Master', description: 'Complete level 10', unlocked: false },
        { id: 'score_500', name: 'High Scorer', description: 'Reach score 500', unlocked: true },
        { id: 'no_pause', name: 'Marathon Run', description: 'Win without pausing', unlocked: false },
      ],
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: vi.fn(),
      startEndlessGame: vi.fn(),
      pauseGame: vi.fn(),
      resumeGame: vi.fn(),
      changeDirection: vi.fn(),
      resetGame: vi.fn(),
      continueGame: vi.fn(),
    });

    render(<Game />);

    expect(screen.getByText('Games Played')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Total Food')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('High Scorer')).toBeInTheDocument();
  });
});
