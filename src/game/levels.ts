import type { Level, Position } from './types';
import { GRID_SIZE, LEVEL_COUNT } from './constants';

const LEVELS: Level[] = [
  { id: 1, name: 'First Steps', description: 'A gentle introduction to the run.', targetScore: 50, speed: 150 },
  { id: 2, name: 'Tight Spaces', description: 'Navigate around the growing obstacles.', targetScore: 100, speed: 140 },
  { id: 3, name: 'Pillar Run', description: 'Navigate around the central obstacle.', targetScore: 150, speed: 130 },
  { id: 4, name: 'Crowded Path', description: 'More obstacles block your way.', targetScore: 200, speed: 120 },
  { id: 5, name: 'Split Paths', description: 'Navigate between wall barriers.', targetScore: 250, speed: 110 },
  { id: 6, name: 'Maze Runner', description: 'The board is getting crowded.', targetScore: 300, speed: 100 },
  { id: 7, name: 'Obstacle Field', description: 'Dodge through a field of barriers.', targetScore: 350, speed: 90 },
  { id: 8, name: 'Narrow Corridors', description: 'Tight spaces demand precision.', targetScore: 400, speed: 80 },
  { id: 9, name: 'Chaos Zone', description: 'Obstacles everywhere. Stay sharp.', targetScore: 450, speed: 70 },
  { id: 10, name: 'Final Run', description: 'The ultimate challenge. Can you make it?', targetScore: 500, speed: 60 },
];

export default LEVELS;

export function getLevelData(levelId: number) {
  const data = LEVELS[levelId - 1];
  if (!data) {
    throw new Error(`Invalid level ID: ${levelId}. Must be between 1 and ${LEVEL_COUNT}.`);
  }
  return data;
}

export function generateObstacles(
  levelId: number,
  snake: Position[],
  food: Position,
): Position[] {
  const count = Math.min(Math.max(1, Math.floor(levelId * 0.5)), 8);
  const occupied = new Set([
    ...snake.map(p => `${p.x},${p.y}`),
    `${food.x},${food.y}`,
  ]);
  const obstacles: Position[] = [];

  for (let i = 0; i < count * 10 && obstacles.length < count; i++) {
    const pos: Position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    const key = `${pos.x},${pos.y}`;
    if (!occupied.has(key)) {
      obstacles.push(pos);
      occupied.add(key);
    }
  }
  return obstacles;
}
