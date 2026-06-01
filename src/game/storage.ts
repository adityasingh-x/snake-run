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
