import { useState, useCallback, useEffect } from 'react';
import type { Screen } from './types/navigation';
import { loadGameProfile, type GameProfile } from './game/profile';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { StatisticsScreen } from './components/StatisticsScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HelpScreen } from './components/HelpScreen';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [startLevel, setStartLevel] = useState(1);
  const [profile, setProfile] = useState<GameProfile>(() => loadGameProfile());

  // Refresh profile from storage whenever the menu or stat/achievement screens are shown.
  // The engine persists progression in the background; reading once at mount leaves
  // MainMenu / StatisticsScreen with stale values after returning from a run.
  useEffect(() => {
    if (screen === 'menu' || screen === 'statistics' || screen === 'achievements') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: re-read localStorage when returning to a read-only screen
      setProfile(loadGameProfile());
    }
  }, [screen]);

  const handleNavigate = useCallback((next: Screen) => {
    setScreen(next);
  }, []);

  const handleStartGame = useCallback((level: number) => {
    setStartLevel(level);
    setScreen('game');
  }, []);

  const handleNavigateToMenu = useCallback(() => {
    setScreen('menu');
    setStartLevel(1);
  }, []);

  return (
    <>
      {screen === 'menu' && (
        <MainMenu
          lastUnlockedLevel={profile.progress.lastUnlockedLevel}
          highScore={profile.progress.highScore}
          onNavigate={handleNavigate}
          onStartGame={handleStartGame}
        />
      )}
      {screen === 'game' && (
        <Game startLevel={startLevel} onNavigateToMenu={handleNavigateToMenu} />
      )}
      {screen === 'statistics' && (
        <StatisticsScreen stats={profile.statistics} onBack={handleNavigateToMenu} />
      )}
      {screen === 'achievements' && (
        <AchievementsScreen achievements={profile.achievements} onBack={handleNavigateToMenu} />
      )}
      {screen === 'settings' && (
        <SettingsScreen onBack={handleNavigateToMenu} />
      )}
      {screen === 'help' && (
        <HelpScreen onBack={handleNavigateToMenu} />
      )}
    </>
  );
}

export default App;
