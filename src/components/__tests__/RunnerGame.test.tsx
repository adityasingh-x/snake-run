import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('../../hooks/useGame');
vi.mock('../../hooks/useTouch');
vi.mock('../../platform/sound', () => ({
  sharedSoundManager: {
    isEnabled: vi.fn(() => true),
    toggleSound: vi.fn(),
    initAudio: vi.fn(),
    playEat: vi.fn(),
    playCollision: vi.fn(),
    playLevelUp: vi.fn(),
    playMilestone: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

import { useGame } from '../../hooks/useGame';
import { RunnerGame } from '../RunnerGame';

const mockUseGame = vi.mocked(useGame);

const makeRunnerPlayingState = () => ({
  snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
  food: { position: { x: 10, y: 5 }, type: 'normal' as const, timer: -1 },
  direction: 'UP' as const,
  nextDirection: 'UP' as const,
  status: 'playing' as const,
  score: 0,
  highScore: 0,
  level: 1,
  obstacles: [],
  lastUnlockedLevel: 1,
  foodEaten: 0,
  isEndless: false,
  speedEffectTicks: 0,
  isRunner: true,
  distance: 0,
  lane: 1 as const,
  maxMultiplier: 1,
});

describe('RunnerGame — animation wiring', () => {
  const getTickIntervalMock = vi.fn(() => 150);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGame.mockReturnValue({
      state: makeRunnerPlayingState(),
      stats: { gamesPlayed: 0, totalFood: 0, bestLevel: 1, highScore: 0 },
      achievements: [],
      celebrateMultiplier: null,
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: vi.fn(),
      continueFromLevel: vi.fn(),
      restartLevel: vi.fn(),
      startEndlessGame: vi.fn(),
      startRunner: vi.fn(),
      changeLane: vi.fn(),
      getTickInterval: getTickIntervalMock,
      pauseGame: vi.fn(),
      resumeGame: vi.fn(),
      changeDirection: vi.fn(),
      resetGame: vi.fn(),
      continueGame: vi.fn(),
    });
  });

  function getInnerDiv() {
    const board = screen.getByRole('grid');
    return board.firstElementChild as HTMLElement;
  }

  it('sets --viewport-speed CSS custom property from tick interval', () => {
    render(<RunnerGame />);
    expect(getInnerDiv().style.getPropertyValue('--viewport-speed')).toBe('150ms');
  });

  it('adds boardAnimated class on tick', () => {
    render(<RunnerGame />);
    expect(getInnerDiv().className).toContain('boardAnimated');
  });

  it('skips animation restart when headY delta > 1 (wrap-around)', () => {
    const { rerender } = render(<RunnerGame />);
    expect(getTickIntervalMock).toHaveBeenCalledTimes(1);

    getTickIntervalMock.mockClear();

    const wrapState = {
      ...makeRunnerPlayingState(),
      snake: [{ x: 10, y: 16 }, { x: 9, y: 15 }, { x: 8, y: 14 }],
    };
    mockUseGame.mockReturnValue({
      state: wrapState,
      stats: { gamesPlayed: 0, totalFood: 0, bestLevel: 1, highScore: 0 },
      achievements: [],
      celebrateMultiplier: null,
      initAudio: vi.fn(),
      startGame: vi.fn(),
      startGameAtLevel: vi.fn(),
      continueFromLevel: vi.fn(),
      restartLevel: vi.fn(),
      startEndlessGame: vi.fn(),
      startRunner: vi.fn(),
      changeLane: vi.fn(),
      getTickInterval: getTickIntervalMock,
      pauseGame: vi.fn(),
      resumeGame: vi.fn(),
      changeDirection: vi.fn(),
      resetGame: vi.fn(),
      continueGame: vi.fn(),
    });

    rerender(<RunnerGame />);

    expect(getTickIntervalMock).not.toHaveBeenCalled();
  });
});
