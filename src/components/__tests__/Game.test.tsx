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
  food: { x: 5, y: 5 },
  direction: 'RIGHT' as const,
  nextDirection: 'RIGHT' as const,
  status: 'playing' as const,
  score: 0,
  highScore: 0,
  level: 1,
  obstacles: [],
  lastUnlockedLevel: 1,
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
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: vi.fn(),
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
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: vi.fn(),
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
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: mockStartAtLevel,
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
});
