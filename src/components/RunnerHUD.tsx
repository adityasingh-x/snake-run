import styles from './RunnerHUD.module.css';

interface RunnerHUDProps {
  distance: number;
  snakeLength: number;
  highScore: number;
  score: number;
  multiplier: number;
  celebrating: boolean;
}

export const RunnerHUD = ({ distance, snakeLength, highScore, score, multiplier, celebrating }: RunnerHUDProps) => {
  const multiplierClass = [styles.section, styles.multiplierSection, celebrating ? styles.celebrating : ''].filter(Boolean).join(' ');

  return (
    <>
      <div className={styles.runnerHud} aria-live="polite">
        <div className={`${styles.section} ${styles.scoreSection}`}>
          <span className={styles.label}>Score</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
        <div className={styles.separator} />
        <div className={multiplierClass}>
          <span className={styles.label}>Multiplier</span>
          <span className={styles.multiplierValue}>x{multiplier}</span>
        </div>
        <div className={styles.separator} />
        <div className={styles.section}>
          <span className={styles.label}>Length</span>
          <span className={styles.value}>{snakeLength}</span>
        </div>
        <div className={styles.separator} />
        <div className={styles.section}>
          <span className={styles.label}>Distance</span>
          <span className={styles.value}>{distance}</span>
        </div>
        <div className={styles.separator} />
        <div className={`${styles.section} ${styles.highScoreSection}`}>
          <span className={styles.label}>Best</span>
          <span className={styles.highScoreValue}>{highScore}</span>
        </div>
      </div>
      <div className="sr-only" aria-live="assertive" role="status">
        Score: {score}. Multiplier: x{multiplier}. Length: {snakeLength}. Distance: {distance}.
      </div>
    </>
  );
};
