import type { ScoreBoardProps } from '../types/components';
import styles from './ScoreBoard.module.css';

export const ScoreBoard = ({ score, highScore, level, levelName, foodEaten, foodRequired }: ScoreBoardProps) => {
  return (
    <>
      <div className={styles.scoreboard} aria-live="polite">
        <div className={styles.score}>
          <span className={styles.label}>Level:</span>
          <span className={styles.value}>{level}{levelName ? ` — ${levelName}` : ''}</span>
        </div>
        <div className={styles.foodProgress}>
          <span className={styles.label}>Food:</span>
          <span className={styles.value}>{foodEaten}/{foodRequired}</span>
        </div>
        <div className={styles.score}>
          <span className={styles.label}>Score:</span>
          <span className={styles.value}>{score}</span>
        </div>
        <div className={`${styles.score} ${styles.highScore}`}>
          <span className={styles.label}>High Score:</span>
          <span className={styles.value}>{highScore}</span>
        </div>
      </div>
      <div className="sr-only" aria-live="assertive" role="status">
        {score > 0 && `Score: ${score}. `}{foodEaten > 0 && `Food: ${foodEaten} of ${foodRequired}. `}
        Level {level}.
      </div>
    </>
  );
};
