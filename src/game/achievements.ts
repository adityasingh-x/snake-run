import type { GameState } from './types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

const ACHIEVEMENT_KEY = 'snakeAchievements';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'beat_game', name: 'Snake Master', description: 'Complete level 10', unlocked: false },
  { id: 'score_500', name: 'High Scorer', description: 'Reach score 500', unlocked: false },
  { id: 'no_pause', name: 'Marathon Run', description: 'Win without pausing', unlocked: false },
];

export function loadAchievements(): Achievement[] {
  let unlockedIds: string[] = [];
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_KEY);
    if (raw) {
      unlockedIds = JSON.parse(raw);
    }
  } catch {
    unlockedIds = [];
  }

  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockedIds.includes(a.id),
  }));
}

export function saveAchievement(id: string): void {
  try {
    const current = loadAchievements();
    const already = current.find(a => a.id === id);
    if (already && already.unlocked) return;

    let unlockedIds: string[] = [];
    const raw = localStorage.getItem(ACHIEVEMENT_KEY);
    if (raw) {
      unlockedIds = JSON.parse(raw);
    }
    if (!unlockedIds.includes(id)) {
      unlockedIds.push(id);
      localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(unlockedIds));
    }
  } catch {
    // ignore
  }
}

export function checkAchievements(state: GameState, prevState: GameState, wasPaused: boolean, unlockedIds: Set<string>): string[] {
  const unlocked: string[] = [];

  if (state.status === 'won' && prevState.status !== 'won') {
    unlocked.push('beat_game');
  }

  if (state.score >= 500 && prevState.score < 500) {
    unlocked.push('score_500');
  }

  if (state.status === 'won' && !wasPaused) {
    unlocked.push('no_pause');
  }

  return unlocked.filter(id => !unlockedIds.has(id));
}
