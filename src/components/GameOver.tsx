import type { GameOverProps } from '../types/components';
import styles from './GameOver.module.css';

export const GameOver = ({ score, onRestart, variant = 'gameover' }: GameOverProps) => {
  const isWin = variant === 'win';

  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverModal} data-win={isWin || undefined}>
        <h2>{isWin ? 'You Win!' : 'Game Over!'}</h2>
        <p className={styles.finalScore}>
          {isWin ? `You completed the game! Score: ${score}` : `Your score: ${score}`}
        </p>
        <button className={styles.restartButton} onClick={onRestart}>
          Play Again
        </button>
        <p className={styles.hint}>Press Space to restart</p>
      </div>
    </div>
  );
};
