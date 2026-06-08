import screenStyles from './Screen.module.css';
import styles from './PauseMenu.module.css';

interface PauseMenuProps {
  onResume: () => void;
  onRestartLevel: () => void;
  onReturnToMenu: () => void;
}

export const PauseMenu = ({ onResume, onRestartLevel, onReturnToMenu }: PauseMenuProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h2 className={styles.heading}>Paused</h2>
        <div className={screenStyles.neonDivider} />
        <button
          className={`${styles.menuButton} ${styles.primaryButton}`}
          onClick={onResume}
          autoFocus
          type="button"
        >
          Resume
        </button>
        <button
          className={styles.menuButton}
          onClick={onRestartLevel}
          type="button"
        >
          Restart Level
        </button>
        <button
          className={`${styles.menuButton} ${styles.mutedButton}`}
          onClick={onReturnToMenu}
          type="button"
        >
          Return to Menu
        </button>
        <p className={styles.hint}>Press Space to resume</p>
      </div>
    </div>
  );
};
