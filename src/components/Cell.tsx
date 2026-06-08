import { memo } from 'react';
import type { CellProps } from '../types/components';
import styles from './Cell.module.css';

export const Cell = memo(({ x, y, isSnakeHead, isSnakeBody, foodType, isObstacle, isPortal, direction }: CellProps) => {
  let className = styles.cell;
  if (isSnakeHead) {
    className += ` ${styles.snakeHead}`;
    if (direction) className += ` ${styles[`snakeHead--${direction.toLowerCase()}`]}`;
  }
  else if (isSnakeBody) className += ` ${styles.snakeBody}`;
  else if (foodType === 'gold') className += ` ${styles.gold}`;
  else if (foodType === 'poison') className += ` ${styles.poison}`;
  else if (foodType === 'slow') className += ` ${styles.slow}`;
  else if (foodType === 'normal') className += ` ${styles.food}`;
  if (isObstacle) className += ` ${styles.obstacle}`;
  if (isPortal) className += ` ${styles.portal}`;

  let ariaLabel = `Cell ${x},${y}`;
  if (isSnakeHead) ariaLabel = `Snake head at ${x},${y}`;
  else if (isSnakeBody) ariaLabel = `Snake body at ${x},${y}`;
  else if (foodType === 'gold') ariaLabel = `Gold food at ${x},${y}`;
  else if (foodType === 'poison') ariaLabel = `Poison food at ${x},${y}`;
  else if (foodType === 'slow') ariaLabel = `Slow food at ${x},${y}`;
  else if (foodType === 'normal') ariaLabel = `Food at ${x},${y}`;
  else if (isObstacle) ariaLabel = `Obstacle at ${x},${y}`;
  else if (isPortal) ariaLabel = `Portal at ${x},${y}`;

  return (
    <div
      className={className}
      role="gridcell"
      aria-label={ariaLabel}
    >
      {isSnakeHead && (
        <div className={styles.eyes} />
      )}
    </div>
  );
});
