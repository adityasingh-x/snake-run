import type { GameOverProps } from '../types/components';
import styles from './GameOver.module.css';

export const GameOver = ({ score, onRestart, onContinueFromLevel, lastUnlockedLevel, variant = 'gameover' }: GameOverProps) => {
  const isWin = variant === 'win';

  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverModal} data-win={isWin || undefined}>
        <h2>{isWin ? 'You Win!' : 'Game Over!'}</h2>
        <p className={styles.finalScore}>
          {isWin ? `You completed the game! Score: ${score}` : `Your score: ${score}`}
        </p>
        {lastUnlockedLevel > 1 ? (
          <>
            <button className={styles.restartButton} onClick={() => onContinueFromLevel(lastUnlockedLevel)} autoFocus>
              Continue from Level {lastUnlockedLevel}
            </button>
            <button className={styles.secondaryButton} onClick={onRestart}>
              New Game
            </button>
          </>
        ) : (
          <>
            <button className={styles.restartButton} onClick={onRestart} autoFocus>
              Play Again
            </button>
          </>
        )}
        <p className={styles.hint}>
          {lastUnlockedLevel > 1 ? 'Press Space for new game — click Continue to resume' : 'Press Space to restart'}
        </p>
      </div>
    </div>
  );
};
