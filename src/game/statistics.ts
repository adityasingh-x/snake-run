export interface Stats {
  gamesPlayed: number;
  totalFood: number;
  bestLevel: number;
  highScore: number;
}

const KEY_GAMES_PLAYED = 'snakeStatsGamesPlayed';
const KEY_TOTAL_FOOD = 'snakeStatsTotalFood';
const KEY_BEST_LEVEL = 'snakeStatsBestLevel';

function readNumber(key: string, fallback: number): number {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, value.toString());
  } catch {
    // ignore
  }
}

export function loadStats(): Stats {
  return {
    gamesPlayed: readNumber(KEY_GAMES_PLAYED, 0),
    totalFood: readNumber(KEY_TOTAL_FOOD, 0),
    bestLevel: readNumber(KEY_BEST_LEVEL, 1),
    highScore: 0,
  };
}

export function saveStats(stats: Stats): void {
  writeNumber(KEY_GAMES_PLAYED, stats.gamesPlayed);
  writeNumber(KEY_TOTAL_FOOD, stats.totalFood);
  writeNumber(KEY_BEST_LEVEL, stats.bestLevel);
}

export function incrementGamesPlayed(): void {
  const current = readNumber(KEY_GAMES_PLAYED, 0);
  writeNumber(KEY_GAMES_PLAYED, current + 1);
}

export function incrementTotalFood(count: number): void {
  const current = readNumber(KEY_TOTAL_FOOD, 0);
  writeNumber(KEY_TOTAL_FOOD, current + count);
}

export function updateBestLevel(level: number): void {
  const current = readNumber(KEY_BEST_LEVEL, 1);
  if (level > current) {
    writeNumber(KEY_BEST_LEVEL, level);
  }
}
