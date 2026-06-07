import type { StatisticsProps } from '../types/components';
import styles from './Statistics.module.css';

export const Statistics = ({ gamesPlayed, totalFood, bestLevel, highScore }: StatisticsProps) => {
  return (
    <div className={styles.statsPanel}>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>Games Played</span>
        <span className={styles.statValue}>{gamesPlayed}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>Total Food</span>
        <span className={styles.statValue}>{totalFood}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>Best Level</span>
        <span className={styles.statValue}>{bestLevel}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>High Score</span>
        <span className={styles.highScoreValue}>{highScore}</span>
      </div>
    </div>
  );
};
