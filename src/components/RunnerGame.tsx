import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { useTouch } from '../hooks/useTouch';
import { sharedSoundManager } from '../platform/sound';
import { Board } from './Board';
import { RunnerHUD } from './RunnerHUD';
import { RunnerGameOver } from './RunnerGameOver';
import styles from './RunnerGame.module.css';

interface RunnerGameProps {
  onNavigateToMenu?: () => void;
}

export const RunnerGame = ({ onNavigateToMenu }: RunnerGameProps) => {
  const { state, initAudio, startRunner, changeLane } = useGame();
  const [soundOn, setSoundOn] = useState(() => sharedSoundManager.isEnabled());

  useEffect(() => {
    return sharedSoundManager.subscribe(setSoundOn);
  }, []);
  const boardRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const toggleSound = useCallback(() => {
    sharedSoundManager.toggleSound();
    setSoundOn(sharedSoundManager.isEnabled());
  }, []);

  const handleStart = useCallback(() => {
    initAudio();
    startRunner();
    setHasStarted(true);
  }, [initAudio, startRunner]);

  const [laneChangeDir, setLaneChangeDir] = useState<'left' | 'right' | null>(null);
  const laneChangeTimerRef = useRef<number | null>(null);

  const handleLaneChange = useCallback((dir: -1 | 1) => {
    changeLane(dir);
    if (laneChangeTimerRef.current) clearTimeout(laneChangeTimerRef.current);
    setLaneChangeDir(dir === -1 ? 'left' : 'right');
    laneChangeTimerRef.current = window.setTimeout(() => {
      setLaneChangeDir(null);
      laneChangeTimerRef.current = null;
    }, 200);
  }, [changeLane]);

  useEffect(() => {
    return () => {
      if (laneChangeTimerRef.current) clearTimeout(laneChangeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        e.preventDefault();
        handleLaneChange(-1);
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        e.preventDefault();
        handleLaneChange(1);
      } else if (key === ' ' || key === 'Spacebar') {
        e.preventDefault();
        if (!hasStarted || state.status === 'gameover') {
          initAudio();
          startRunner();
          setHasStarted(true);
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        if (onNavigateToMenu) onNavigateToMenu();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hasStarted, state.status, handleLaneChange, startRunner, initAudio, onNavigateToMenu]);

  useTouch({
    onSwipe: (dir) => {
      if (dir === 'LEFT') handleLaneChange(-1);
      if (dir === 'RIGHT') handleLaneChange(1);
    },
    enabled: state.status === 'playing' && state.isRunner,
    boardRef,
  });

  const isGameOver = state.status === 'gameover' && state.isRunner;

  return (
    <div className={styles.runnerContainer}>
      <div className={styles.toolbar}>
        <button onClick={toggleSound} aria-label={soundOn ? 'Mute' : 'Unmute'} className={styles.toolbarBtn}>
          {soundOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
        </button>
        {onNavigateToMenu && (
          <button onClick={onNavigateToMenu} className={styles.toolbarBtn}>
            Menu
          </button>
        )}
      </div>

      <RunnerHUD
        distance={state.distance}
        foodEaten={state.foodEaten}
        snakeLength={state.snake.length}
        highScore={state.highScore}
        score={state.score}
      />

      <div ref={boardRef} className={styles.boardWrapper}>
        <Board
          snake={state.snake}
          direction={state.direction}
          food={state.food}
          obstacles={state.obstacles}
          runnerLane={state.lane}
          viewportHeadY={state.isRunner && state.status === 'playing' ? state.snake[0].y : undefined}
          laneChangeDirection={laneChangeDir}
        />
      </div>

      {!hasStarted && (
        <div className={styles.startOverlay}>
          <h2 className={styles.startTitle}>Runner Mode</h2>
          <p className={styles.startHint}>Press Space or tap to start</p>
          <button onClick={handleStart} autoFocus className={styles.startBtn} type="button">
            Start
          </button>
        </div>
      )}

      {isGameOver && (
        <RunnerGameOver
          distance={state.distance}
          foodEaten={state.foodEaten}
          snakeLength={state.snake.length}
          highScore={state.highScore}
          score={state.score}
          onPlayAgain={handleStart}
          onReturnToMenu={onNavigateToMenu}
        />
      )}
    </div>
  );
};
