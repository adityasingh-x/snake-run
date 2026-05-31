import { useMemo } from 'react';
import { GRID_SIZE, CELL_SIZE } from '../utils/constants';
import { positionsEqual } from '../utils/gameLogic';
import { Cell } from './Cell';
import type { BoardProps } from '../types/components';
import styles from './Board.module.css';

export const Board = ({ snake, food, obstacles }: BoardProps) => {
  const grid = useMemo(() => {
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }, []);

  const snakeBodySet = useMemo(
    () => new Set(snake.slice(1).map(p => `${p.x},${p.y}`)),
    [snake]
  );

  const obstaclesSet = useMemo(
    () => new Set(obstacles.map(p => `${p.x},${p.y}`)),
    [obstacles]
  );

  return (
    <div
      className={styles.board}
      role="grid"
      aria-label="Snake game board"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
      }}
    >
      {grid.map(({ x, y }) => {
        const pos = { x, y };
        const key = `${x},${y}`;
        const isSnakeHead = positionsEqual(pos, snake[0]);
        const isSnakeBody = snakeBodySet.has(key);
        const isFood = positionsEqual(pos, food);
        const isObstacle = obstaclesSet.has(key);

        return (
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            isSnakeHead={isSnakeHead}
            isSnakeBody={isSnakeBody}
            isFood={isFood}
            isObstacle={isObstacle}
          />
        );
      })}
    </div>
  );
};
