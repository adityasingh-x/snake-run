import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { useKeyboard } from '../hooks/useKeyboard';
import { useTouch } from '../hooks/useTouch';
import { sharedSoundManager } from '../platform/sound';
import { Board } from './Board';
import { ScoreBoard } from './ScoreBoard';
import { GameOver } from './GameOver';
import styles from './Game.module.css';

const STATUS_ANNOUNCEMENTS: Record<string, string> = {
  idle: 'Snake Run ready. Press Space or click Start to begin.',
  playing: 'Game started. Use arrow keys or WASD to move.',
  paused: 'Game paused. Press Space or click Resume to continue.',
  gameover: 'Game over!',
  won: 'You won! You completed the game!',
};

export const Game = () => {
  const {
    state,
    initAudio,
    startGame,
    pauseGame,
    resumeGame,
    changeDirection,
    resetGame,
  } = useGame();

  const [soundOn, setSoundOn] = useState(() => sharedSoundManager.isEnabled());

  const handleToggleSound = useCallback(() => {
    const next = sharedSoundManager.toggleSound();
    setSoundOn(next);
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
      <h1 className={styles.title}>Snake Run</h1>
      <ScoreBoard score={state.score} highScore={state.highScore} level={state.level} soundOn={soundOn} onToggleSound={handleToggleSound} />
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
        {state.status === 'gameover' && (
          <GameOver score={state.score} onRestart={handleRestart} />
        )}
        {state.status === 'won' && (
          <GameOver score={state.score} onRestart={handleRestart} variant="win" />
        )}
      </div>
      <div className={styles.dpad}>
        <button className={styles.dpadBtn} onClick={() => changeDirection('UP')} aria-label="Move up">▲</button>
        <div className={styles.dpadRow}>
          <button className={styles.dpadBtn} onClick={() => changeDirection('LEFT')} aria-label="Move left">◀</button>
          <div className={styles.dpadCenter} />
          <button className={styles.dpadBtn} onClick={() => changeDirection('RIGHT')} aria-label="Move right">▶</button>
        </div>
        <button className={styles.dpadBtn} onClick={() => changeDirection('DOWN')} aria-label="Move down">▼</button>
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
