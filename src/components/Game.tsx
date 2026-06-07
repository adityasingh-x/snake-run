import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { useKeyboard } from '../hooks/useKeyboard';
import { useTouch } from '../hooks/useTouch';
import { sharedSoundManager } from '../platform/sound';
import { getLevelData } from '../game/levels';
import { LEVEL_COUNT } from '../game/constants';
import { Board } from './Board';
import { ScoreBoard } from './ScoreBoard';
import { GameOver } from './GameOver';
import { LevelTransition } from './LevelTransition';
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

export const Game = () => {
  const {
    state,
    initAudio,
    startGame,
    startGameAtLevel,
    pauseGame,
    resumeGame,
    changeDirection,
    resetGame,
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

  const handleStart = useCallback(() => {
    initAudio();
    startGame();
  }, [initAudio, startGame]);

  const handleResume = useCallback(() => {
    initAudio();
    resumeGame();
  }, [initAudio, resumeGame]);

  const handleRestart = useCallback(() => {
    initAudio();
    resetGame();
  }, [initAudio, resetGame]);

  const handlePause = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  const handleContinue = useCallback(() => {
    initAudio();
    continueGame();
  }, [initAudio, continueGame]);

  const handleStartAtLevel = useCallback((level: number) => {
    initAudio();
    startGameAtLevel(level);
  }, [initAudio, startGameAtLevel]);

  const [devLevel, setDevLevel] = useState(1);

  const handleDpadUp = useCallback(() => changeDirection('UP'), [changeDirection]);
  const handleDpadDown = useCallback(() => changeDirection('DOWN'), [changeDirection]);
  const handleDpadLeft = useCallback(() => changeDirection('LEFT'), [changeDirection]);
  const handleDpadRight = useCallback(() => changeDirection('RIGHT'), [changeDirection]);

  const announceRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(state.status);

  useKeyboard({
    status: state.status,
    currentDirection: state.direction,
    onStart: handleStart,
    onPause: pauseGame,
    onResume: handleResume,
    onRestart: handleRestart,
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
            onClick={() => handleStartAtLevel(devLevel)}
            type="button"
          >
            Go
          </button>
        </div>
      )}
      <ScoreBoard score={state.score} highScore={state.highScore} level={state.level} levelName={getLevelData(state.level).name} foodEaten={state.foodEaten} foodRequired={getLevelData(state.level).foodRequired} />
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
        <Board snake={state.snake} direction={state.direction} food={state.food} obstacles={state.obstacles} />
        {state.status === 'idle' && (
          <div className={styles.overlay}>
            <div className={styles.overlayContent}>
              <h2>Snake Run</h2>
              <p>Use arrow keys or WASD to move</p>
              <button className={styles.startButton} onClick={handleStart} autoFocus>
                Start Game
              </button>
              <p className={styles.hint}>Or press Space</p>
            </div>
          </div>
        )}
        {state.status === 'paused' && (
          <div className={styles.overlay}>
            <div className={styles.overlayContent}>
              <h2>Paused</h2>
              <button className={styles.startButton} onClick={handleResume} autoFocus>
                Resume
              </button>
              <p className={styles.hint}>Or press Space</p>
            </div>
          </div>
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
        {state.status === 'gameover' && (
          <GameOver score={state.score} onRestart={handleRestart} onContinueFromLevel={handleStartAtLevel} lastUnlockedLevel={state.lastUnlockedLevel} />
        )}
        {state.status === 'won' && (
          <GameOver score={state.score} onRestart={handleRestart} onContinueFromLevel={handleStartAtLevel} lastUnlockedLevel={state.lastUnlockedLevel} variant="win" />
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
