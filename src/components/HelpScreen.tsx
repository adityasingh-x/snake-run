import screenStyles from './Screen.module.css';
import styles from './HelpScreen.module.css';

interface HelpScreenProps {
  onBack: () => void;
}

export const HelpScreen = ({ onBack }: HelpScreenProps) => {
  return (
    <div className={screenStyles.screen}>
      <div className={screenStyles.screenContent}>
        <h2 className={screenStyles.screenHeading}>How To Play</h2>
        <div className={screenStyles.neonDivider} />

        <div className={styles.sections}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Controls</h3>
            <ul className={styles.list}>
              <li>Arrow keys or WASD to move the snake</li>
              <li>Space to pause or resume</li>
              <li>On mobile, swipe in the direction you want to move</li>
              <li>Use the on-screen D-pad buttons (toggle with the gamepad icon)</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Food Types</h3>
            <ul className={styles.list}>
              <li>
                <span className={styles.foodNormal}>Normal Food</span>: +10 points, snake grows by 1
              </li>
              <li>
                <span className={styles.foodGold}>Gold Food</span>: +30 points, grows by 1, despawns after a few seconds
              </li>
              <li>
                <span className={styles.foodPoison}>Poison Food</span>: 0 points, snake shrinks by 1 (minimum length 3)
              </li>
              <li>
                <span className={styles.foodSlow}>Slow Food</span>: +10 points, temporarily slows the snake
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Special Mechanics</h3>
            <ul className={styles.list}>
              <li><strong>Portals:</strong> Some levels have portals that instantly teleport the snake to the exit portal</li>
              <li><strong>Wrap-Around:</strong> In certain levels, the snake wraps from one edge to the opposite edge</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Progression</h3>
            <ul className={styles.list}>
              <li>Eat enough food to complete each level objective</li>
              <li>Complete level 10 to win the game</li>
              <li>After winning, unlock Endless Mode for infinite play</li>
              <li>Your progress is saved automatically</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Achievements</h3>
            <ul className={styles.list}>
              <li>Snake Master: Complete level 10</li>
              <li>High Scorer: Reach 500 points in a single run</li>
              <li>Marathon Run: Win without ever pausing</li>
            </ul>
          </section>
        </div>

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
