import styles from './RunnerGameOver.module.css';

interface RunnerGameOverProps {
  distance: number;
  foodEaten: number;
  snakeLength: number;
  highScore: number;
  onPlayAgain: () => void;
  onReturnToMenu?: () => void;
}

export const RunnerGameOver = ({ distance, foodEaten, snakeLength, highScore, onPlayAgain, onReturnToMenu }: RunnerGameOverProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Run Over!</h2>
        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Distance</span>
            <span className={styles.statValue}>{distance}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Food</span>
            <span className={styles.statValue}>{foodEaten}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Length</span>
            <span className={styles.statValue}>{snakeLength}</span>
          </div>
          <div className={`${styles.statRow} ${styles.highScoreRow}`}>
            <span className={styles.statLabel}>Best</span>
            <span className={styles.statValue}>{highScore}</span>
          </div>
        </div>
        <button
          className={styles.primaryButton}
          onClick={onPlayAgain}
          autoFocus
          type="button"
        >
          Play Again
        </button>
        {onReturnToMenu && (
          <button
            className={styles.mutedButton}
            onClick={onReturnToMenu}
            type="button"
          >
            Menu
          </button>
        )}
        <p className={styles.hint}>
          Press Space to play again
        </p>
      </div>
    </div>
  );
};
