import type { Achievement } from '../game/achievements';
import styles from './Achievements.module.css';

interface AchievementsProps {
  achievements: Achievement[];
  newAchievementIds?: string[];
}

export const Achievements = ({ achievements, newAchievementIds = [] }: AchievementsProps) => {
  return (
    <div className={styles.achievementsPanel}>
      <h3 className={styles.title}>Achievements</h3>
      <div className={styles.list}>
        {achievements.map(a => {
          const isNew = newAchievementIds.includes(a.id);
          return (
            <div key={a.id} className={`${styles.achievementItem} ${a.unlocked ? styles.unlocked : styles.locked}`}>
              <span className={styles.achievementName}>
                {a.unlocked ? a.name : '???'}
              </span>
              {isNew && <span className={styles.newBadge}>NEW</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
