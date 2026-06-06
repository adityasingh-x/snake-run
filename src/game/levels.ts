import type { Level, Position } from './types';
import { LEVEL_COUNT } from './constants';

const LEVELS: Level[] = [
  {
    id: 1,
    name: 'First Meal',
    description: 'Learn to move and collect food.',
    targetScore: 50,
    speed: 150,
    layout: [],
  },
  {
    id: 2,
    name: 'Pillar Run',
    description: 'Navigate around the central pillar.',
    targetScore: 100,
    speed: 140,
    layout: [
      { x: 9, y: 6 }, { x: 10, y: 6 },
      { x: 9, y: 7 }, { x: 10, y: 7 },
    ],
  },
  {
    id: 3,
    name: 'Split Paths',
    description: 'Choose your path between the walls.',
    targetScore: 150,
    speed: 130,
    layout: [
      { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }, { x: 6, y: 8 },
      { x: 6, y: 13 }, { x: 6, y: 14 }, { x: 6, y: 15 }, { x: 6, y: 16 }, { x: 6, y: 17 },
      { x: 13, y: 3 }, { x: 13, y: 4 }, { x: 13, y: 5 }, { x: 13, y: 6 }, { x: 13, y: 7 }, { x: 13, y: 8 },
      { x: 13, y: 13 }, { x: 13, y: 14 }, { x: 13, y: 15 }, { x: 13, y: 16 }, { x: 13, y: 17 },
    ],
  },
  {
    id: 4,
    name: 'Crossroads',
    description: 'Navigate through the divided sectors.',
    targetScore: 200,
    speed: 120,
    layout: [
      { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 },
      { x: 9, y: 11 }, { x: 9, y: 12 }, { x: 9, y: 13 }, { x: 9, y: 14 },
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 },
      { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 },
    ],
  },
  {
    id: 5,
    name: 'Maze Runner',
    description: 'Plan your route through the winding maze.',
    targetScore: 250,
    speed: 110,
    layout: [
      { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 },
      { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 }, { x: 12, y: 10 }, { x: 12, y: 11 },
      { x: 13, y: 11 }, { x: 14, y: 11 }, { x: 15, y: 11 },
    ],
  },
  {
    id: 6,
    name: 'Narrow Passage',
    description: 'Manage your growing length through tight corridors.',
    targetScore: 300,
    speed: 100,
    layout: [
      { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 },
      { x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 7, y: 11 }, { x: 8, y: 11 }, { x: 9, y: 11 }, { x: 11, y: 11 }, { x: 13, y: 11 }, { x: 14, y: 11 },
    ],
  },
  {
    id: 7,
    name: 'Four Chambers',
    description: 'Travel efficiently between the four chambers.',
    targetScore: 350,
    speed: 90,
    layout: [
      { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 },
      { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 },
      { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 },
      { x: 9, y: 13 }, { x: 9, y: 14 }, { x: 9, y: 15 }, { x: 9, y: 16 }, { x: 9, y: 17 },
    ],
  },
  {
    id: 8,
    name: 'Spiral',
    description: 'Follow the spiral to find your way.',
    targetScore: 400,
    speed: 80,
    layout: [
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 },
      { x: 8, y: 4 }, { x: 8, y: 5 }, { x: 8, y: 6 }, { x: 8, y: 7 }, { x: 8, y: 8 }, { x: 8, y: 9 },
      { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 12, y: 9 }, { x: 13, y: 9 },
      { x: 13, y: 10 }, { x: 13, y: 11 }, { x: 13, y: 12 }, { x: 13, y: 13 },
      { x: 12, y: 13 }, { x: 11, y: 13 }, { x: 10, y: 13 },
      { x: 10, y: 12 },
    ],
  },
  {
    id: 9,
    name: 'Survival Grid',
    description: 'Navigate under pressure through dense obstacles.',
    targetScore: 450,
    speed: 70,
    layout: [
      { x: 4, y: 3 }, { x: 4, y: 7 }, { x: 4, y: 11 }, { x: 4, y: 15 },
      { x: 9, y: 3 }, { x: 9, y: 7 }, { x: 9, y: 11 }, { x: 9, y: 15 },
      { x: 14, y: 3 }, { x: 14, y: 7 }, { x: 14, y: 11 }, { x: 14, y: 15 },
      { x: 3, y: 4 }, { x: 7, y: 4 }, { x: 11, y: 4 }, { x: 15, y: 4 }, { x: 17, y: 4 },
      { x: 3, y: 9 }, { x: 7, y: 9 }, { x: 11, y: 9 }, { x: 15, y: 9 }, { x: 17, y: 9 },
      { x: 3, y: 14 }, { x: 7, y: 14 }, { x: 11, y: 14 }, { x: 15, y: 14 }, { x: 17, y: 14 },
    ],
  },
  {
    id: 10,
    name: 'Final Run',
    description: 'Combine every skill for the ultimate challenge.',
    targetScore: 500,
    speed: 60,
    layout: [
      { x: 3, y: 9 }, { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 },
      { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 },
      { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 },
      { x: 9, y: 12 }, { x: 9, y: 13 }, { x: 9, y: 14 }, { x: 9, y: 15 }, { x: 9, y: 16 }, { x: 9, y: 17 },
      { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 },
      { x: 14, y: 6 }, { x: 14, y: 7 }, { x: 14, y: 8 },
      { x: 3, y: 14 }, { x: 4, y: 14 }, { x: 5, y: 14 },
    ],
  },
];

export default LEVELS;

export function getLevelData(levelId: number) {
  const data = LEVELS[levelId - 1];
  if (!data) {
    throw new Error(`Invalid level ID: ${levelId}. Must be between 1 and ${LEVEL_COUNT}.`);
  }
  return data;
}

export function generateObstacles(levelId: number): Position[] {
  const data = getLevelData(levelId);
  return [...data.layout];
}
