import { useMemo } from 'react';
import { GRID_SIZE } from '../utils/constants';
import { positionsEqual } from '../utils/gameLogic';
import { Cell } from './Cell';
import type { BoardProps } from '../types/components';
import styles from './Board.module.css';

export const Board = ({ snake, direction, food, obstacles, wrapAround, portals }: BoardProps) => {
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

  const portalSet = useMemo(
    () => new Set((portals ?? []).map(p => `${p.x},${p.y}`)),
    [portals]
  );

  return (
    <div
      className={styles.board}
      role="grid"
      aria-label="Snake Run board"
      data-wrap-around={wrapAround ? 'true' : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      }}
    >
      {grid.map(({ x, y }) => {
        const pos = { x, y };
        const key = `${x},${y}`;
        const isSnakeHead = positionsEqual(pos, snake[0]);
        const isSnakeBody = snakeBodySet.has(key);
        const isFood = positionsEqual(pos, food.position);
        const isObstacle = obstaclesSet.has(key);
        const isPortal = portalSet.has(key);

        return (
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            isSnakeHead={isSnakeHead}
            isSnakeBody={isSnakeBody}
            foodType={isFood ? food.type : undefined}
            isObstacle={isObstacle}
            isPortal={isPortal}
            direction={isSnakeHead ? direction : undefined}
          />
        );
      })}
    </div>
  );
};
