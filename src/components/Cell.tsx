import { CELL_SIZE } from '../utils/constants';
import styles from './Cell.module.css';

interface CellProps {
  x: number;
  y: number;
  isSnakeHead: boolean;
  isSnakeBody: boolean;
  isFood: boolean;
  isObstacle: boolean;
}

export const Cell = ({ x, y, isSnakeHead, isSnakeBody, isFood, isObstacle }: CellProps) => {
  let className = styles.cell;
  if (isSnakeHead) className += ` ${styles.snakeHead}`;
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
    />
  );
};
