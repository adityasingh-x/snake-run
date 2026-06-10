import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { useKeyboard } from '../hooks/useKeyboard';
import { useTouch } from '../hooks/useTouch';
import { sharedSoundManager } from '../platform/sound';
import { getLevelData, getPortalPositions } from '../game/levels';
import { LEVEL_COUNT } from '../game/constants';
import { Board } from './Board';
import { ScoreBoard } from './ScoreBoard';
import { GameOver } from './GameOver';
import { LevelTransition } from './LevelTransition';
import { ReadyOverlay } from './ReadyOverlay';
import { PauseMenu } from './PauseMenu';
import styles from './Game.module.css';

const DPAD_STORAGE_KEY = 'snakeDpadEnabled';

const STATUS_ANNOUNCEMENTS: Record<string, string> = {
  idle: 'Snake Run ready. Press Space or click Start to begin.',
  playing: 'Game started. Use arrow keys or WASD to move.',
  paused: 'Game paused. Press Space or click Resume to continue.',
  levelComplete: 'Level complete! Press Space to continue.',
  gameover: 'Game over! Press Space for new game or click Continue.',
  won: 'You won! Press Space for new game or click Continue.',
};

interface GameProps {
  startLevel: number;
  onNavigateToMenu?: () => void;
}

export const Game = ({ startLevel, onNavigateToMenu }: GameProps) => {
  const {
    state,
    stats,
    achievements,
    initAudio,
    startGame,
    startGameAtLevel,
    continueFromLevel,
    restartLevel,
    startEndlessGame,
    pauseGame,
    resumeGame,
    changeDirection,
    continueGame,
  } = useGame();

  const [soundOn, setSoundOn] = useState(() => sharedSoundManager.isEnabled());
  const [dpadOn, setDpadOn] = useState(() => {
    try {
      const stored = localStorage.getItem(DPAD_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  // Keep local soundOn in sync if the user toggled sound in another screen
  // (e.g., SettingsScreen) so the toolbar icon/aria-label stay accurate.
  useEffect(() => {
    return sharedSoundManager.subscribe(setSoundOn);
  }, []);

  // Ready overlay state: when set, shows the ready overlay for the given level
  const [readyLevel, setReadyLevel] = useState<number | null>(startLevel);
  // When true, starting from the ready overlay preserves the run's score
  // (used by Game Over's "Continue from Level N" flow).
  const [continueWithScore, setContinueWithScore] = useState(false);

  const handleToggleSound = useCallback(() => {
    const next = sharedSoundManager.toggleSound();
    setSoundOn(next);
  }, []);

  const handleToggleDpad = useCallback(() => {
    setDpadOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DPAD_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleReadyStart = useCallback(() => {
    initAudio();
    if (readyLevel !== null) {
      if (continueWithScore) {
        continueFromLevel(readyLevel);
        setContinueWithScore(false);
      } else {
        startGameAtLevel(readyLevel);
      }
      setReadyLevel(null);
    } else {
      startGame();
    }
  }, [initAudio, readyLevel, continueWithScore, continueFromLevel, startGameAtLevel, startGame]);

  const handleResume = useCallback(() => {
    initAudio();
    resumeGame();
  }, [initAudio, resumeGame]);

  const handlePause = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  const handleContinue = useCallback(() => {
    initAudio();
    continueGame();
  }, [initAudio, continueGame]);

  const handleStartEndless = useCallback(() => {
    initAudio();
    startEndlessGame();
  }, [initAudio, startEndlessGame]);

  const handleRestartLevel = useCallback(() => {
    initAudio();
    restartLevel();
  }, [initAudio, restartLevel]);

  const handleSetReadyLevel = useCallback((level: number) => {
    setReadyLevel(level);
  }, []);

  const handleReturnToMenu = useCallback(() => {
    onNavigateToMenu?.();
  }, [onNavigateToMenu]);

  const [devLevel, setDevLevel] = useState(1);

  const handleDpadUp = useCallback(() => changeDirection('UP'), [changeDirection]);
  const handleDpadDown = useCallback(() => changeDirection('DOWN'), [changeDirection]);
  const handleDpadLeft = useCallback(() => changeDirection('LEFT'), [changeDirection]);
  const handleDpadRight = useCallback(() => changeDirection('RIGHT'), [changeDirection]);

  const announceRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(state.status);
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);
  const prevUnlockedRef = useRef<Set<string>>(new Set(achievements.filter(a => a.unlocked).map(a => a.id)));

  useEffect(() => {
    const currentUnlocked = new Set(achievements.filter(a => a.unlocked).map(a => a.id));
    const newlyUnlocked: string[] = [];
    for (const id of currentUnlocked) {
      if (!prevUnlockedRef.current.has(id)) {
        newlyUnlocked.push(id);
      }
    }
    if (newlyUnlocked.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: track newly unlocked achievements for session display
      setNewAchievementIds(prev => [...prev, ...newlyUnlocked]);
      for (const id of newlyUnlocked) {
        const achievement = achievements.find(a => a.id === id);
        if (achievement && announceRef.current) {
          announceRef.current.textContent = `Achievement unlocked: ${achievement.name}`;
        }
      }
    }
    prevUnlockedRef.current = currentUnlocked;
  }, [achievements]);

  // When ready overlay is active, present 'idle' to the keyboard layer so Space
  // routes to handleReadyStart (which knows whether to start a new game or
  // resume from the ready overlay via the readyLevel state check).
  const keyboardStatus = readyLevel !== null ? 'idle' : state.status;

  useKeyboard({
    status: keyboardStatus,
    currentDirection: state.direction,
    onStart: handleReadyStart,
    onPause: pauseGame,
    onResume: handleResume,
    onRestart: handleReadyStart,
    onContinue: handleContinue,
    onChangeDirection: changeDirection,
  });

  useTouch({
    onSwipe: changeDirection,
    enabled: state.status === 'playing',
    boardRef,
  });

  useEffect(() => {
    if (prevStatusRef.current !== state.status && announceRef.current) {
      announceRef.current.textContent = STATUS_ANNOUNCEMENTS[state.status] ?? '';
    }
    prevStatusRef.current = state.status;
  }, [state.status]);

  return (
    <div className={styles.gameContainer}>
      {import.meta.env.DEV && (
        <div className={styles.devSelect}>
          <select
            className={styles.devSelectDropdown}
            value={devLevel}
            onChange={(e) => setDevLevel(Number(e.target.value))}
            aria-label="Developer level select"
          >
            {Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Level {n}</option>
            ))}
          </select>
          <button
            className={styles.devSelectBtn}
            onClick={() => {
              initAudio();
              startGameAtLevel(devLevel);
              setReadyLevel(null);
            }}
            type="button"
          >
            Go
          </button>
        </div>
      )}
      <ScoreBoard score={state.score} highScore={state.highScore} level={state.level} levelName={getLevelData(state.level).name} foodEaten={state.foodEaten} foodRequired={getLevelData(state.level).foodRequired} isEndless={state.isEndless} speedEffectTicks={state.speedEffectTicks} />
      <div className={styles.controlsRow}>
        <button
          className={styles.toolbarBtn}
          onClick={handleToggleSound}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          type="button"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button
          className={`${styles.toolbarBtn} ${styles.dpadToggle}`}
          onClick={handleToggleDpad}
          aria-label={dpadOn ? 'Hide D-pad' : 'Show D-pad'}
          aria-pressed={dpadOn}
          type="button"
        >
          🎮
        </button>
        {(state.status === 'playing' || state.status === 'paused') && (
          <button
            className={styles.toolbarBtn}
            onClick={state.status === 'playing' ? handlePause : handleResume}
            aria-label={state.status === 'playing' ? 'Pause game' : 'Resume game'}
            type="button"
            autoFocus={false}
          >
            {state.status === 'playing' ? '⏸' : '▶'}
          </button>
        )}
      </div>
      <div className={styles.boardWrapper} ref={boardRef}>
        <Board snake={state.snake} direction={state.direction} food={state.food} obstacles={state.obstacles} wrapAround={getLevelData(state.level).wrapAround} portals={getPortalPositions(state.level)} />
        {readyLevel !== null && (
          <ReadyOverlay
            startLevel={readyLevel}
            levelName={getLevelData(readyLevel).name}
            levelDescription={getLevelData(readyLevel).description}
            levelObjective={`Eat ${getLevelData(readyLevel).foodRequired} food to complete this level.`}
            onStart={handleReadyStart}
          />
        )}
        {state.status === 'paused' && readyLevel === null && (
          <PauseMenu
            onResume={handleResume}
            onRestartLevel={handleRestartLevel}
            onReturnToMenu={handleReturnToMenu}
          />
        )}
        {state.status === 'levelComplete' && (
          <LevelTransition
            completedLevelId={state.level}
            completedLevelName={getLevelData(state.level).name}
            nextLevelName={getLevelData(state.level + 1).name}
            nextLevelDescription={getLevelData(state.level + 1).description}
            score={state.score}
            onContinue={handleContinue}
          />
        )}
        {(state.status === 'gameover' || state.status === 'won') && readyLevel === null && (
          <GameOver
            score={state.score}
            onRestart={() => {
              setContinueWithScore(false);
              handleSetReadyLevel(1);
            }}
            onContinueFromLevel={(level) => {
              setContinueWithScore(true);
              handleSetReadyLevel(level);
            }}
            lastUnlockedLevel={state.lastUnlockedLevel}
            variant={state.status === 'won' ? 'win' : 'gameover'}
            isEndless={state.isEndless}
            onStartEndless={handleStartEndless}
            onReturnToMenu={handleReturnToMenu}
            stats={stats}
            achievements={achievements}
            newAchievementIds={newAchievementIds}
          />
        )}
      </div>
      <div className={`${styles.dpad} ${(state.status === 'playing' || state.status === 'paused') && dpadOn ? '' : styles.dpadHidden}`}>
        <button className={styles.dpadBtn} onClick={handleDpadUp} aria-label="Move up">▲</button>
        <div className={styles.dpadRow}>
          <button className={styles.dpadBtn} onClick={handleDpadLeft} aria-label="Move left">◀</button>
          <div className={styles.dpadCenter} />
          <button className={styles.dpadBtn} onClick={handleDpadRight} aria-label="Move right">▶</button>
        </div>
        <button className={styles.dpadBtn} onClick={handleDpadDown} aria-label="Move down">▼</button>
      </div>
      <div className={styles.controlsInfo}>
        <p>
          <strong>Controls:</strong> Arrow keys or WASD to move, Space to
          start/pause
        </p>
      </div>
      <div ref={announceRef} className="sr-only" aria-live="assertive" role="status" />
    </div>
  );
};
