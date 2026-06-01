import { useEffect, useRef, useState, useCallback } from 'react';
import { useSnakeGame } from '../hooks/useSnakeGame';
import { useKeyboard } from '../hooks/useKeyboard';
import { useTouch } from '../hooks/useTouch';
import { useSound } from '../hooks/useSound';
import { Board } from './Board';
import { ScoreBoard } from './ScoreBoard';
import { GameOver } from './GameOver';
import styles from './Game.module.css';

const STATUS_ANNOUNCEMENTS: Record<string, string> = {
  idle: 'Snake Game ready. Press Space or click Start to begin.',
  playing: 'Game started. Use arrow keys or WASD to move.',
  paused: 'Game paused. Press Space or click Resume to continue.',
  gameover: 'Game over!',
  won: 'You won! Completed all 10 levels!',
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
  } = useSnakeGame();

  const { toggleSound, isEnabled } = useSound();
  const [soundOn, setSoundOn] = useState(() => isEnabled());

  const handleToggleSound = useCallback(() => {
    const next = toggleSound();
    setSoundOn(next);
  }, [toggleSound]);

  const announceRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(state.status);

  useKeyboard({
    status: state.status,
    currentDirection: state.direction,
    onStart: () => { initAudio(); startGame(); },
    onPause: pauseGame,
    onResume: () => { initAudio(); resumeGame(); },
    onRestart: () => { initAudio(); resetGame(); },
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
      <h1 className={styles.title}>Snake Game</h1>
      <ScoreBoard score={state.score} highScore={state.highScore} level={state.level} soundOn={soundOn} onToggleSound={handleToggleSound} />
      <div className={styles.boardWrapper} ref={boardRef}>
        <Board snake={state.snake} direction={state.direction} food={state.food} obstacles={state.obstacles} />
        {state.status === 'idle' && (
          <div className={styles.overlay}>
            <div className={styles.overlayContent}>
              <h2>Snake Game</h2>
              <p>Use arrow keys or WASD to move</p>
              <button className={styles.startButton} onClick={() => { initAudio(); startGame(); }} autoFocus>
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
              <button className={styles.startButton} onClick={() => { initAudio(); resumeGame(); }} autoFocus>
                Resume
              </button>
              <p className={styles.hint}>Or press Space</p>
            </div>
          </div>
        )}
        {state.status === 'gameover' && (
          <GameOver score={state.score} onRestart={() => { initAudio(); resetGame(); }} />
        )}
        {state.status === 'won' && (
          <GameOver score={state.score} onRestart={() => { initAudio(); resetGame(); }} variant="win" />
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
