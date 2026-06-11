import { memo, useMemo } from 'react';
import { GRID_SIZE, RUNNER_LANE_X, RUNNER_VIEWPORT_TAIL } from '../utils/constants';
import { positionsEqual } from '../utils/gameLogic';
import { Cell } from './Cell';
import type { BoardProps } from '../types/components';
import styles from './Board.module.css';

export const Board = memo(({ snake, direction, food, obstacles, wrapAround, portals, runnerLane, viewportHeadY, laneChangeDirection }: BoardProps) => {
  const grid = useMemo(() => {
    const cells: { x: number; y: number; screenY: number }[] = [];
    if (viewportHeadY !== undefined) {
      for (let screenY = 0; screenY < GRID_SIZE; screenY++) {
        const gridY = ((screenY + viewportHeadY - RUNNER_VIEWPORT_TAIL) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
        for (let x = 0; x < GRID_SIZE; x++) {
          cells.push({ x, y: gridY, screenY });
        }
      }
    } else {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          cells.push({ x, y, screenY: y });
        }
      }
    }
    return cells;
  }, [viewportHeadY]);

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

  const isViewportScrolling = viewportHeadY !== undefined;

  return (
    <div
      className={styles.board}
      role="grid"
      aria-label={runnerLane !== undefined ? "Snake Run runner board — 3 lanes" : "Snake Run board"}
      data-wrap-around={wrapAround ? 'true' : undefined}
      data-runner={runnerLane !== undefined ? 'true' : undefined}
      data-viewport-scrolling={isViewportScrolling ? 'true' : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      }}
    >
      {grid.map(({ x, y, screenY }) => {
        const pos = { x, y };
        const key = `${x},${y}`;
        const isSnakeHead = positionsEqual(pos, snake[0]);
        const isSnakeBody = snakeBodySet.has(key);
        const isFood = positionsEqual(pos, food.position);
        const isObstacle = obstaclesSet.has(key);
        const isPortal = portalSet.has(key);
        const isLaneColumn = runnerLane !== undefined && RUNNER_LANE_X.includes(x);
        const isActiveLane = isLaneColumn && x === RUNNER_LANE_X[runnerLane];

        return (
          <Cell
            key={`${screenY}-${x}`}
            x={x}
            y={y}
            isSnakeHead={isSnakeHead}
            isSnakeBody={isSnakeBody}
            foodType={isFood ? food.type : undefined}
            isObstacle={isObstacle}
            isPortal={isPortal}
            direction={isSnakeHead ? direction : undefined}
            isLaneColumn={isLaneColumn}
            isActiveLane={isActiveLane}
            isViewportScrolling={isViewportScrolling}
            laneChangeDirection={isSnakeHead ? laneChangeDirection : undefined}
          />
        );
      })}
    </div>
  );
});
