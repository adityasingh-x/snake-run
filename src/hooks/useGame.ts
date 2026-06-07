import { useEffect, useCallback, useRef, useState } from 'react';
import type { Direction, GameState } from '../game/types';
import { Engine } from '../game/Engine';
import { sharedSoundManager } from '../platform/sound';
import type { Stats } from '../game/statistics';
import type { Achievement } from '../game/achievements';
import { loadAchievements } from '../game/achievements';

export function useGame() {
  const engineRef = useRef<Engine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new Engine();
  }

  // eslint-disable-next-line react-hooks/refs -- lazy initializer reads ref set above
  const [state, setState] = useState<GameState>(() => engineRef.current!.getState());
  // eslint-disable-next-line react-hooks/refs -- lazy initializer reads ref set above
  const [stats, setStats] = useState<Stats>(() => engineRef.current!.getStats());
  const [achievements, setAchievements] = useState<Achievement[]>(() => loadAchievements());

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const unsubscribe = engine.subscribe((newState) => {
      setState({ ...newState });
      setStats(engine.getStats());
    });
    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const onEat = () => sharedSoundManager.playEat();
    const onCollision = () => sharedSoundManager.playCollision();
    const onLevelUp = () => sharedSoundManager.playLevelUp();
    const onAchievementUnlock = () => {
      setAchievements(loadAchievements());
    };

    engine.onEat = onEat;
    engine.onGameOver = onCollision;
    engine.onLevelUp = onLevelUp;
    engine.onWin = onLevelUp;
    engine.onAchievementUnlock = onAchievementUnlock;

    return () => {
      engine.onEat = undefined;
      engine.onGameOver = undefined;
      engine.onLevelUp = undefined;
      engine.onWin = undefined;
      engine.onAchievementUnlock = undefined;
    };
  }, []);

  const initAudio = useCallback(() => {
    sharedSoundManager.initAudio();
  }, []);

  const startGame = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const pauseGame = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resumeGame = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const changeDirection = useCallback((direction: Direction) => {
    engineRef.current?.changeDirection(direction);
  }, []);

  const resetGame = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const continueGame = useCallback(() => {
    engineRef.current?.continueGame();
  }, []);

  const startGameAtLevel = useCallback((level: number) => {
    engineRef.current?.startAtLevel(level);
  }, []);

  const startEndlessGame = useCallback(() => {
    engineRef.current?.startEndless();
  }, []);

  return {
    state,
    stats,
    achievements,
    initAudio,
    startGame,
    startGameAtLevel,
    startEndlessGame,
    pauseGame,
    resumeGame,
    changeDirection,
    resetGame,
    continueGame,
  };
}
