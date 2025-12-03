import React, { useState, useEffect } from 'react';
import { GameConfigScreen } from './components/GameConfig';
import { GamePlay } from './components/GamePlay';
import { ResultScreen } from './components/ResultScreen';
import { GameConfig, ProblemAttempt, Language } from './types';

enum Screen {
  CONFIG,
  GAME,
  RESULTS
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.CONFIG);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [results, setResults] = useState<{ attempts: ProblemAttempt[], duration: number } | null>(null);
  
  // Initialize language from localStorage, default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yancy-mathetris-lang');
      return (saved === 'en' || saved === 'cn') ? saved : 'en';
    }
    return 'en';
  });

  // Persist language choice
  useEffect(() => {
    localStorage.setItem('yancy-mathetris-lang', language);
  }, [language]);

  const handleStart = (config: GameConfig) => {
    setGameConfig(config);
    setScreen(Screen.GAME);
  };

  const handleFinish = (attempts: ProblemAttempt[], duration: number) => {
    setResults({ attempts, duration });
    setScreen(Screen.RESULTS);
  };

  const handleExit = () => {
    setScreen(Screen.CONFIG);
    setGameConfig(null);
  };

  return (
    <div className="antialiased text-slate-800 bg-slate-50 min-h-screen">
      {screen === Screen.CONFIG && (
        <GameConfigScreen 
          onStart={handleStart} 
          language={language} 
          setLanguage={setLanguage} 
        />
      )}
      
      {screen === Screen.GAME && gameConfig && (
        <GamePlay 
            config={gameConfig} 
            onFinish={handleFinish} 
            onExit={handleExit}
            language={language}
        />
      )}
      
      {screen === Screen.RESULTS && results && gameConfig && (
        <ResultScreen 
            attempts={results.attempts}
            totalDuration={results.duration}
            config={gameConfig}
            onHome={handleExit}
            language={language}
        />
      )}
    </div>
  );
}