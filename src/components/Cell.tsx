import { memo } from 'react';
import { CELL_SIZE } from '../utils/constants';
import type { CellProps } from '../types/components';
import styles from './Cell.module.css';

export const Cell = memo(({ x, y, isSnakeHead, isSnakeBody, isFood, isObstacle, direction }: CellProps) => {
  let className = styles.cell;
  if (isSnakeHead) {
    className += ` ${styles.snakeHead}`;
    if (direction) className += ` ${styles[`snakeHead--${direction.toLowerCase()}`]}`;
  }
  else if (isSnakeBody) className += ` ${styles.snakeBody}`;
  else if (isFood) className += ` ${styles.food}`;
  if (isObstacle) className += ` ${styles.obstacle}`;

  let ariaLabel = `Cell ${x},${y}`;
  if (isSnakeHead) ariaLabel = `Snake head at ${x},${y}`;
  else if (isSnakeBody) ariaLabel = `Snake body at ${x},${y}`;
  else if (isFood) ariaLabel = `Food at ${x},${y}`;
  else if (isObstacle) ariaLabel = `Obstacle at ${x},${y}`;

  return (
    <div
      className={className}
      role="gridcell"
      aria-label={ariaLabel}
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
    >
      {isSnakeHead && (
        <div className={styles.eyes} />
      )}
    </div>
  );
});
