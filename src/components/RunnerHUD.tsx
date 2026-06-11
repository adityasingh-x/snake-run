import styles from './RunnerHUD.module.css';

interface RunnerHUDProps {
  distance: number;
  foodEaten: number;
  snakeLength: number;
  highScore: number;
  score: number;
}

export const RunnerHUD = ({ distance, foodEaten, snakeLength, highScore, score }: RunnerHUDProps) => {
  return (
    <>
      <div className={styles.runnerHud} aria-live="polite">
        <div className={`${styles.section} ${styles.scoreSection}`}>
          <span className={styles.label}>Score</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
        <div className={styles.separator} />
        <div className={styles.section}>
          <span className={styles.label}>Distance</span>
          <span className={styles.value}>{distance}</span>
        </div>
        <div className={styles.separator} />
        <div className={styles.section}>
          <span className={styles.label}>Food</span>
          <span className={styles.value}>{foodEaten}</span>
        </div>
        <div className={styles.separator} />
        <div className={styles.section}>
          <span className={styles.label}>Length</span>
          <span className={styles.value}>{snakeLength}</span>
        </div>
        <div className={styles.separator} />
        <div className={`${styles.section} ${styles.highScoreSection}`}>
          <span className={styles.label}>Best</span>
          <span className={styles.highScoreValue}>{highScore}</span>
        </div>
      </div>
      <div className="sr-only" aria-live="assertive" role="status">
        Score: {score}. Distance: {distance}. Food: {foodEaten}. Length: {snakeLength}.
      </div>
    </>
  );
};
