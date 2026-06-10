import { useState, useCallback, useEffect, useRef } from 'react';
import { sharedSoundManager } from '../platform/sound';
import { useTheme, THEME_OPTIONS, type ThemeValue } from '../hooks/useTheme';
import screenStyles from './Screen.module.css';
import styles from './SettingsScreen.module.css';

interface SettingsScreenProps {
  onBack: () => void;
}

type ConfirmAction = 'progress' | 'statistics' | 'achievements' | null;

const CONFIRM_MESSAGES: Record<Exclude<ConfirmAction, null>, string> = {
  progress: 'Reset all progress? This will erase your unlocked levels.',
  statistics: 'Reset all statistics? This will erase games played, food eaten, and best level.',
  achievements: 'Reset all achievements? This will lock all achievements again.',
};

export const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const [theme, setTheme] = useTheme();
  const [soundOn, setSoundOn] = useState(() => sharedSoundManager.isEnabled());
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleToggleSound = useCallback(() => {
    const next = sharedSoundManager.toggleSound();
    setSoundOn(next);
  }, []);

  const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as ThemeValue);
  }, [setTheme]);

  const handleConfirm = useCallback(() => {
    if (!confirmAction) return;
    try {
      if (confirmAction === 'progress') {
        localStorage.removeItem('snakeLastUnlockedLevel');
      } else if (confirmAction === 'statistics') {
        localStorage.removeItem('snakeStatsGamesPlayed');
        localStorage.removeItem('snakeStatsTotalFood');
        localStorage.removeItem('snakeStatsBestLevel');
      } else if (confirmAction === 'achievements') {
        localStorage.removeItem('snakeAchievements');
      }
    } catch {
      // ignore
    }
    setConfirmAction(null);
  }, [confirmAction]);

  useEffect(() => {
    if (confirmAction && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [confirmAction]);

  // Keep local soundOn in sync if the user toggled sound elsewhere
  // (e.g., Game toolbar).
  useEffect(() => {
    return sharedSoundManager.subscribe(setSoundOn);
  }, []);

  useEffect(() => {
    if (!confirmAction) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setConfirmAction(null);
        return;
      }
      if (e.key !== 'Tab') return;
      // Focus trap: cycle focus between the Cancel and Confirm buttons
      // so Tab/Shift+Tab cannot escape the dialog and trigger destructive
      // actions on the screen behind it.
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [confirmAction]);

  return (
    <div className={screenStyles.screen}>
      <div className={screenStyles.screenContent}>
        <h2 className={screenStyles.screenHeading}>Settings</h2>
        <div className={screenStyles.neonDivider} />

        <div className={styles.sections}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Audio</h3>
            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Sound Effects</span>
              <button
                className={`${styles.toggleBtn} ${soundOn ? styles.toggleOn : styles.toggleOff}`}
                onClick={handleToggleSound}
                type="button"
                aria-pressed={soundOn}
              >
                {soundOn ? 'ON' : 'OFF'}
              </button>
            </label>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Appearance</h3>
            <label className={styles.selectRow}>
              <span className={styles.selectLabel}>Theme</span>
              <select
                className={styles.select}
                value={theme}
                onChange={handleThemeChange}
                aria-label="Select theme"
              >
                {THEME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
          </section>

          <section className={`${styles.section} ${styles.dangerSection}`}>
            <h3 className={styles.sectionTitle}>Danger Zone</h3>
            <button
              className={`${styles.dangerBtn} ${styles.resetBtn}`}
              onClick={() => setConfirmAction('progress')}
              type="button"
            >
              Reset Progress
            </button>
            <button
              className={`${styles.dangerBtn} ${styles.resetBtn}`}
              onClick={() => setConfirmAction('statistics')}
              type="button"
            >
              Reset Statistics
            </button>
            <button
              className={`${styles.dangerBtn} ${styles.resetBtn}`}
              onClick={() => setConfirmAction('achievements')}
              type="button"
            >
              Reset Achievements
            </button>
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

        {confirmAction && (
          <div className={styles.confirmOverlay} onClick={() => setConfirmAction(null)} role="dialog" aria-modal="true">
            <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
              <p className={styles.confirmText}>{CONFIRM_MESSAGES[confirmAction]}</p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.confirmCancelBtn}
                  onClick={() => setConfirmAction(null)}
                  type="button"
                  ref={cancelRef}
                >
                  Cancel
                </button>
                <button
                  className={styles.confirmConfirmBtn}
                  onClick={handleConfirm}
                  type="button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
