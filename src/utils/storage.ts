export function loadHighScore(): number {
  return parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
}

export function saveHighScore(score: number): void {
  const current = loadHighScore();
  if (score > current) {
    localStorage.setItem('snakeHighScore', score.toString());
  }
}
