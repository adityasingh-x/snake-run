const HIGH_SCORE_KEY = 'snakeHighScore';
const LAST_UNLOCKED_KEY = 'snakeLastUnlockedLevel';

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

export function loadHighScore(): number {
  return readNumber(HIGH_SCORE_KEY, 0);
}

export function saveHighScore(score: number): void {
  const current = readNumber(HIGH_SCORE_KEY, 0);
  if (score > current) {
    writeNumber(HIGH_SCORE_KEY, score);
  }
}

export function loadLastUnlockedLevel(): number {
  return readNumber(LAST_UNLOCKED_KEY, 1);
}

export function saveLastUnlockedLevel(level: number): void {
  const current = readNumber(LAST_UNLOCKED_KEY, 1);
  if (level > current) {
    writeNumber(LAST_UNLOCKED_KEY, level);
  }
}
