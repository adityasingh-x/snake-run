
import type { Achievement } from '../game/achievements';
import { Achievements } from './Achievements';
import styles from './AchievementsScreen.module.css';
import screenStyles from './Screen.module.css';

interface AchievementsScreenProps {
  achievements: Achievement[];
  onBack: () => void;
}

export const AchievementsScreen = ({ achievements, onBack }: AchievementsScreenProps) => {
  return (
    <div className={screenStyles.screen}>
      <div className={screenStyles.screenContent}>
        <h2 className={screenStyles.screenHeading}>Achievements</h2>
        <div className={screenStyles.neonDivider} />
        <Achievements achievements={achievements} />
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
