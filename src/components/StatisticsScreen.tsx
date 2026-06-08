import type { Stats } from '../game/statistics';
import { Statistics } from './Statistics';
import styles from './StatisticsScreen.module.css';
import screenStyles from './Screen.module.css';

interface StatisticsScreenProps {
  stats: Stats;
  onBack: () => void;
}

export const StatisticsScreen = ({ stats, onBack }: StatisticsScreenProps) => {
  return (
    <div className={screenStyles.screen}>
      <div className={screenStyles.screenContent}>
        <h2 className={screenStyles.screenHeading}>Statistics</h2>
        <div className={screenStyles.neonDivider} />
        <Statistics
          gamesPlayed={stats.gamesPlayed}
          totalFood={stats.totalFood}
          bestLevel={stats.bestLevel}
          highScore={stats.highScore}
        />
        <button
          className={`${screenStyles.backButton} ${styles.backButton}`}
          onClick={onBack}
          type="button"
          autoFocus
        >
          Back
        </button>
      </div>
    </div>
  );
};
