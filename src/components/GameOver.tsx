import type { GameOverProps } from '../types/components';
import { Statistics } from './Statistics';
import { Achievements } from './Achievements';
import styles from './GameOver.module.css';

interface ButtonDef {
  label: string;
  onClick: () => void;
  autoFocus: boolean;
  variant: 'primary' | 'secondary';
}

export const GameOver = ({ score, onRestart, onContinueFromLevel, lastUnlockedLevel, variant = 'gameover', isEndless, onStartEndless, onReturnToMenu, stats, achievements, newAchievementIds }: GameOverProps) => {
  const isWin = variant === 'win';

  const buttons: ButtonDef[] = [];

  if (isWin && !isEndless && onStartEndless) {
    buttons.push({ label: 'Endless Mode', onClick: onStartEndless, autoFocus: true, variant: 'primary' });
  }

  if (lastUnlockedLevel > 1) {
    if (!isWin) {
      buttons.push({ label: `Continue from Level ${lastUnlockedLevel}`, onClick: () => onContinueFromLevel(lastUnlockedLevel), autoFocus: true, variant: 'primary' });
    } else if (!isEndless) {
      buttons.push({ label: `Continue from Level ${lastUnlockedLevel}`, onClick: () => onContinueFromLevel(lastUnlockedLevel), autoFocus: !onStartEndless, variant: 'primary' });
    }
    buttons.push({ label: 'New Game', onClick: onRestart, autoFocus: false, variant: 'secondary' });
  } else {
    buttons.push({ label: 'Play Again', onClick: onRestart, autoFocus: !isWin || !onStartEndless, variant: 'primary' });
  }

  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverModal} data-win={isWin || undefined}>
        <h2>{isWin ? 'You Win!' : 'Game Over!'}</h2>
        <p className={styles.finalScore}>
          {isEndless ? `Endless Score: ${score}` : isWin ? `You completed the game! Score: ${score}` : `Your score: ${score}`}
        </p>
        {buttons.map(btn => (
          <button
            key={btn.label}
            className={btn.variant === 'primary' ? styles.restartButton : styles.secondaryButton}
            onClick={btn.onClick}
            autoFocus={btn.autoFocus}
          >
            {btn.label}
          </button>
        ))}
        {onReturnToMenu && (
          <button
            className={styles.mutedButton}
            onClick={onReturnToMenu}
            type="button"
          >
            Return to Menu
          </button>
        )}
        {stats && (
          <Statistics gamesPlayed={stats.gamesPlayed} totalFood={stats.totalFood} bestLevel={stats.bestLevel} highScore={stats.highScore} />
        )}
        {achievements && achievements.some(a => a.unlocked) && (
          <Achievements achievements={achievements} newAchievementIds={newAchievementIds} />
        )}
        <p className={styles.hint}>
          {isWin && !isEndless ? 'Press Space for new game, or choose Endless Mode' : 'Press Space for new game'}
        </p>
      </div>
    </div>
  );
};
