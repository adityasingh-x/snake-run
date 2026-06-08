import { describe, it, expect } from 'vitest';
import { getReachableCount, countFreeCells } from '../reachability';

describe('getReachableCount', () => {
  it('returns all 400 cells on empty grid', () => {
    expect(getReachableCount({ x: 10, y: 10 }, [])).toBe(400);
  });

  it('returns correct count with obstacles blocking half grid', () => {
    const obstacles: Array<{ x: number; y: number }> = [];
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 10; y++) {
        obstacles.push({ x, y });
      }
    }
    expect(getReachableCount({ x: 15, y: 15 }, obstacles)).toBe(200);
  });

  it('excludes enclosed cell surrounded by obstacles', () => {
    const obstacles = [
      { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 },
      { x: 9, y: 10 }, { x: 11, y: 10 },
      { x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 },
    ];
    const count = getReachableCount({ x: 10, y: 10 }, obstacles);
    expect(count).toBe(1);
  });

  it('portal teleport allows BFS to reach both chambers', () => {
    const obstacles: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < 20; y++) {
      obstacles.push({ x: 10, y });
    }
    const portals: [{ x: number; y: number }, { x: number; y: number }][] = [
      [{ x: 5, y: 10 }, { x: 15, y: 10 }],
    ];
    const count = getReachableCount({ x: 5, y: 10 }, obstacles, portals);
    expect(count).toBe(380);
  });

  it('wrap-around allows BFS to reach entire board minus obstacle', () => {
    const obstacles = [{ x: 10, y: 5 }];
    const count = getReachableCount({ x: 0, y: 0 }, obstacles, undefined, true);
    expect(count).toBe(399);
  });

  it('level 7 obstacles + portals reachable count matches expectation', () => {
    const obstacles = [
      { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 },
      { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 },
      { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 },
      { x: 9, y: 13 }, { x: 9, y: 14 }, { x: 9, y: 15 }, { x: 9, y: 16 }, { x: 9, y: 17 },
    ];
    const portals: [{ x: number; y: number }, { x: number; y: number }][] = [
      [{ x: 2, y: 4 }, { x: 16, y: 15 }],
    ];
    const count = getReachableCount({ x: 10, y: 10 }, obstacles, portals);
    expect(count).toBe(380);
  });
});

describe('countFreeCells', () => {
  it('returns 400 with no obstacles', () => {
    expect(countFreeCells(0)).toBe(400);
  });

  it('returns correct count with obstacles and portals', () => {
    expect(countFreeCells(25, 2)).toBe(373);
  });

  it('handles custom grid size', () => {
    expect(countFreeCells(4, 0, 10)).toBe(96);
  });
});
