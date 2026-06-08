import screenStyles from './Screen.module.css';
import styles from './ReadyOverlay.module.css';

interface ReadyOverlayProps {
  startLevel: number;
  levelName: string;
  levelDescription: string;
  levelObjective: string;
  onStart: () => void;
}

export const ReadyOverlay = ({
  startLevel,
  levelName,
  levelDescription,
  levelObjective,
  onStart,
}: ReadyOverlayProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.levelNumber}>Level {startLevel}</div>
        <h2 className={styles.levelName}>{levelName}</h2>
        <p className={styles.levelDescription}>{levelDescription}</p>
        <div className={screenStyles.neonDivider} />
        <p className={styles.levelObjective}>{levelObjective}</p>
        <button
          className={styles.startButton}
          onClick={onStart}
          autoFocus
          type="button"
        >
          Start
        </button>
        <p className={styles.hint}>Press Space to start</p>
      </div>
    </div>
  );
};
