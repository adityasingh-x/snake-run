import type { ScoreBoardProps } from '../types/components';
import styles from './ScoreBoard.module.css';

export const ScoreBoard = ({ score, highScore, level, levelName, foodEaten, foodRequired, isEndless }: ScoreBoardProps) => {
  return (
    <>
      <div className={styles.scoreboard} aria-live="polite">
        <div className={styles.section}>
          <span className={styles.label}>{isEndless ? 'Endless' : 'Level:'}</span>
          {!isEndless && (
            <>
              <span className={styles.levelValue}>{level}</span>
              {levelName && <span className={styles.levelName}> — {levelName}</span>}
            </>
          )}
        </div>
        {!isEndless && (
          <>
            <div className={styles.separator} />
            <div className={styles.section}>
              <span className={styles.label}>Food:</span>
              <span className={styles.foodText}>{foodEaten}/{foodRequired}</span>
              <div className={styles.foodMeter}>
                <div className={styles.foodMeterFill} style={{ width: `${(foodEaten / foodRequired) * 100}%` }} />
              </div>
            </div>
          </>
        )}
        <div className={styles.separator} />
        <div className={styles.section}>
          <span className={styles.label}>Score:</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
        <div className={styles.separator} />
        <div className={`${styles.section} ${styles.highScoreSection}`}>
          <span className={styles.label}>High Score:</span>
          <span className={styles.highScoreValue}>{highScore}</span>
        </div>
      </div>
      <div className="sr-only" aria-live="assertive" role="status">
        {score > 0 && `Score: ${score}. `}{!isEndless && foodEaten > 0 && `Food: ${foodEaten} of ${foodRequired}. `}
        {isEndless ? 'Endless mode.' : `Level ${level}.`}
      </div>
    </>
  );
};
