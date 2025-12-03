import React, { useState } from 'react';
import { GameConfig, GapPosition, Language } from '../types';
import { Play, Globe } from 'lucide-react';
import { getT } from '../utils/i18n';
import { audioManager } from '../utils/audio';

interface Props {
  onStart: (config: GameConfig) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const DEFAULT_CONFIG: GameConfig = {
  numberRange: 20,
  steps: 1,
  gapPosition: GapPosition.RIGHT,
  answerRange: 20,
  difficultyRandom: false,
  totalQuestions: 20,
  targetTimeSeconds: 5,
  instantFeedback: true,
};

export const GameConfigScreen: React.FC<Props> = ({ onStart, language, setLanguage }) => {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const t = getT(language).config;
  const tApp = getT(language);

  const handleChange = (key: keyof GameConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'cn' : 'en');
  };

  const handleStartGame = () => {
    // Resume audio context on user interaction
    audioManager.ensureContext().catch(console.error);
    onStart(config);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border-4 border-indigo-200">
        <div className="bg-indigo-100 p-6 flex items-center justify-between border-b border-indigo-200">
          <h1 className="text-3xl font-bold text-indigo-800 tracking-tight">
            {tApp.appTitle}
          </h1>
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
          >
            <Globe size={16} />
            {language === 'en' ? 'English' : '中文'}
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Range */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.maxNumber}
              </label>
              <select
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors font-mono text-lg"
                value={config.numberRange}
                onChange={(e) => handleChange('numberRange', Number(e.target.value))}
              >
                <option value={10}>{t.upTo} 10</option>
                <option value={20}>{t.upTo} 20</option>
                <option value={50}>{t.upTo} 50</option>
                <option value={100}>{t.upTo} 100</option>
              </select>
            </div>

            {/* Answer Range */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.maxAnswer}
              </label>
              <select
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors font-mono text-lg"
                value={config.answerRange}
                onChange={(e) => handleChange('answerRange', Number(e.target.value))}
              >
                <option value={10}>{t.upTo} 10</option>
                <option value={20}>{t.upTo} 20</option>
                <option value={30}>{t.upTo} 30</option>
                <option value={50}>{t.upTo} 50</option>
                <option value={100}>{t.upTo} 100</option>
              </select>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.steps}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <button
                    key={step}
                    onClick={() => handleChange('steps', step)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      config.steps === step
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Gap Position */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.position}
              </label>
              <select
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors font-mono text-lg"
                value={config.gapPosition}
                onChange={(e) => handleChange('gapPosition', e.target.value)}
              >
                <option value={GapPosition.RIGHT}>{t.posRight}</option>
                <option value={GapPosition.LEFT}>{t.posLeft}</option>
                <option value={GapPosition.MIXED}>{t.posMixed}</option>
              </select>
            </div>

             {/* Speed */}
             <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.speed}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={config.targetTimeSeconds}
                onChange={(e) => handleChange('targetTimeSeconds', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="text-right text-slate-500 font-mono text-sm">{config.targetTimeSeconds} {t.secPerProb}</div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                {t.totalQ}
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={config.totalQuestions}
                onChange={(e) => handleChange('totalQuestions', Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-lg"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
             <div className="flex items-center justify-between">
                <div>
                   <span className="text-slate-700 font-medium block">{t.randomDiff}</span>
                   <span className="text-slate-400 text-xs">{t.randomDiffDesc}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.difficultyRandom} onChange={(e) => handleChange('difficultyRandom', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
             </div>
             <div className="flex items-center justify-between">
                <div>
                   <span className="text-slate-700 font-medium block">{t.instantFeedback}</span>
                   <span className="text-slate-400 text-xs">{t.instantFeedbackDesc}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={config.instantFeedback} onChange={(e) => handleChange('instantFeedback', e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
             </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all text-white rounded-xl text-xl font-bold shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
          >
            <Play className="fill-current" />
            {t.startBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
