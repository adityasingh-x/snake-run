import type { Screen } from '../types/navigation';
import styles from './MainMenu.module.css';
import screenStyles from './Screen.module.css';

interface MainMenuProps {
  lastUnlockedLevel: number;
  highScore: number;
  onNavigate: (screen: Screen) => void;
  onStartGame: (level: number) => void;
}

export const MainMenu = ({ lastUnlockedLevel, highScore, onNavigate, onStartGame }: MainMenuProps) => {
  const canContinue = lastUnlockedLevel > 1;

  return (
    <div className={screenStyles.screen}>
      <div className={screenStyles.screenContent}>
        <h1 className={styles.title}>Snake Run</h1>
        <div className={screenStyles.neonDivider} />

        {canContinue && (
          <div className={styles.continueHint}>
            <span>Continue Level {lastUnlockedLevel}</span>
            <span className={styles.highScoreHint}>High Score: {highScore}</span>
          </div>
        )}

        <nav className={styles.menuNav} aria-label="Main menu">
          {canContinue && (
            <button
              className={`${styles.menuButton} ${styles.primaryButton}`}
              onClick={() => onStartGame(lastUnlockedLevel)}
              type="button"
            >
              Continue
            </button>
          )}
          <button
            className={styles.menuButton}
            onClick={() => onStartGame(1)}
            type="button"
          >
            New Game
          </button>
          <button
            className={styles.menuButton}
            onClick={() => onNavigate('statistics')}
            type="button"
          >
            Statistics
          </button>
          <button
            className={styles.menuButton}
            onClick={() => onNavigate('achievements')}
            type="button"
          >
            Achievements
          </button>
          <button
            className={styles.menuButton}
            onClick={() => onNavigate('settings')}
            type="button"
          >
            Settings
          </button>
          <button
            className={styles.menuButton}
            onClick={() => onNavigate('help')}
            type="button"
          >
            Help
          </button>
        </nav>
      </div>
    </div>
  );
};
