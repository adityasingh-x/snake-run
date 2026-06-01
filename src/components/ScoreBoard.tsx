import type { ScoreBoardProps } from '../types/components';
import styles from './ScoreBoard.module.css';

export const ScoreBoard = ({ score, highScore, level, soundOn, onToggleSound }: ScoreBoardProps) => {
  return (
    <>
      <div className={styles.scoreboard} aria-live="polite">
        <div className={styles.score}>
          <span className={styles.label}>Level:</span>
          <span className={styles.value}>{level}</span>
        </div>
        <div className={styles.score}>
          <span className={styles.label}>Score:</span>
          <span className={styles.value}>{score}</span>
        </div>
        <div className={`${styles.score} ${styles.highScore}`}>
          <span className={styles.label}>High Score:</span>
          <span className={styles.value}>{highScore}</span>
        </div>
        <button
          className={styles.soundToggle}
          onClick={onToggleSound}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>
      <div className="sr-only" aria-live="assertive" role="status">
        {score > 0 && `Score: ${score}. `}
        Level {level}.
      </div>
    </>
  );
};
