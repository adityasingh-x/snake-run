import type { LevelTransitionProps } from '../types/components';
import styles from './LevelTransition.module.css';

export const LevelTransition = ({
  completedLevelId,
  completedLevelName,
  nextLevelName,
  nextLevelDescription,
  score,
  onContinue,
}: LevelTransitionProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h2 className={styles.title}>Level {completedLevelId} Complete</h2>
        <p className={styles.completedName}>{completedLevelName}</p>

        <div className={styles.nextSection}>
          <p className={styles.nextLabel}>Next: {nextLevelName}</p>
          <p className={styles.nextDescription}>{nextLevelDescription}</p>
        </div>

        <p className={styles.score}>Score: {score}</p>

        <button
          className={styles.continueButton}
          onClick={onContinue}
          autoFocus
          aria-label="Continue to next level"
        >
          Continue
        </button>
        <p className={styles.hint}>Press Space to continue</p>
      </div>
    </div>
  );
};
