import styles from './RunnerGameOver.module.css';
import { MILESTONES } from '../game';

interface RunnerGameOverProps {
  distance: number;
  foodEaten: number;
  snakeLength: number;
  highScore: number;
  score: number;
  maxMultiplier: number;
  onPlayAgain: () => void;
  onReturnToMenu?: () => void;
}

export const RunnerGameOver = ({ distance, foodEaten, snakeLength, highScore, score, maxMultiplier, onPlayAgain, onReturnToMenu }: RunnerGameOverProps) => {
  const isNewBest = score > 0 && score >= highScore;

  const nextMilestone = MILESTONES.find(m => m > snakeLength) ?? null;
  const atMaxTier = snakeLength >= MILESTONES[MILESTONES.length - 1];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Run Over!</h2>
        <div className={styles.scoreDisplay}>
          <span className={styles.scoreLabel}>Score</span>
          <span className={styles.scoreNumber}>{score}</span>
          {isNewBest && <span className={styles.newBestBadge}>New Best!</span>}
        </div>
        {!isNewBest && (
          <div className={styles.bestComparison}>
            Best: {highScore}
          </div>
        )}
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
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Max Multiplier</span>
            <span className={styles.statValue}>x{maxMultiplier}</span>
          </div>
          {!atMaxTier && nextMilestone !== null && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Next Milestone</span>
              <span className={styles.statValue}>{nextMilestone}</span>
            </div>
          )}
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
