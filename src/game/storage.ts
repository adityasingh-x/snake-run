const LAST_UNLOCKED_KEY = 'snakeLastUnlockedLevel';

export function loadHighScore(): number {
  const val = localStorage.getItem('snakeHighScore') || '0';
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function saveHighScore(score: number): void {
  const current = loadHighScore();
  if (score > current) {
    localStorage.setItem('snakeHighScore', score.toString());
  }
}

export function loadLastUnlockedLevel(): number {
  const val = localStorage.getItem(LAST_UNLOCKED_KEY) || '1';
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

export function saveLastUnlockedLevel(level: number): void {
  const current = loadLastUnlockedLevel();
  if (level > current) {
    localStorage.setItem(LAST_UNLOCKED_KEY, level.toString());
  }
}
