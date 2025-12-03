import React, { useState } from 'react';
import { X, Moon, Sun, Volume2, VolumeX, Zap, BarChart3, Settings as SettingsIcon, Github } from 'lucide-react';
import { GameSettings, PlayerStats, TransitRegion, GameRecord } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  settings: GameSettings;
  updateSettings: (key: keyof GameSettings, value: any) => void;
  stats: PlayerStats;
  currentStreak: number;
  averageScore: number;
  averageGuessesPerGame: number;
  wrongGuesses: number;
  recentGames: GameRecord[];
  sessionStats: {
    systemsSeen: number;
    hintsUsed: number;
    livesLost: number;
  };
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  toggleDarkMode,
  settings,
  updateSettings,
  stats,
  currentStreak,
  averageScore,
  averageGuessesPerGame,
  wrongGuesses,
  recentGames,
  sessionStats,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'stats' | 'credits'>('settings');

  if (!isOpen) return null;

  const calculateAccuracy = () => {
    if (stats.totalGuesses === 0) return '0.00';
    const percent = (stats.correctGuesses / stats.totalGuesses) * 100;
    return Math.min(100, percent).toFixed(2);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const difficultyColors: Record<TransitRegion, string> = {
    Any: 'text-gray-800 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-100',
    'North America': 'text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300',
    Europe: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Asia-Pacific': 'text-orange-700 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300',
    'Latin America': 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Middle East & Africa': 'text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300',
  };

  const difficultyButtonStyles: Record<TransitRegion, { active: string; inactive: string }> = {
    Any: {
      active: 'border-gray-500 bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100',
      inactive: 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300',
    },
    'North America': {
      active: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      inactive: 'border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 hover:border-blue-300',
    },
    Europe: {
      active: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      inactive: 'border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:border-indigo-300',
    },
    'Asia-Pacific': {
      active: 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      inactive: 'border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-300 hover:border-orange-300',
    },
    'Latin America': {
      active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      inactive: 'border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:border-emerald-300',
    },
    'Middle East & Africa': {
      active: 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
      inactive: 'border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 hover:border-rose-300',
    },
  };

  const statCards = [
    { label: 'Games Played', value: stats.gamesPlayed, accent: 'text-gray-800 dark:text-white' },
    { label: 'Best Score', value: stats.bestScore, accent: 'text-blue-600 dark:text-blue-400' },
    { label: 'Current Streak', value: currentStreak, accent: 'text-amber-600 dark:text-amber-400' },
    { label: 'Accuracy', value: `${calculateAccuracy()}%`, accent: 'text-green-600 dark:text-green-400' },
    { label: 'Avg Score', value: averageScore.toFixed(1), accent: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Avg Guesses/Game', value: averageGuessesPerGame.toFixed(1), accent: 'text-teal-600 dark:text-teal-400' },
    { label: 'Correct Answers', value: stats.correctGuesses, accent: 'text-purple-600 dark:text-purple-400' },
    { label: 'Wrong Guesses', value: wrongGuesses, accent: 'text-rose-600 dark:text-rose-400' },
    { label: 'Total Guesses', value: stats.totalGuesses, accent: 'text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl transform transition-all scale-100 border border-gray-200 dark:border-zinc-700 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
            >
              <SettingsIcon size={16} /> Settings
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'stats' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
            >
              <BarChart3 size={16} /> Stats
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'credits' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
            >
              <Github size={16} /> Credits
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {activeTab === 'settings' && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Region Focus</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Any', 'North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'] as TransitRegion[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => updateSettings('difficulty', diff)}
                      className={`p-3 rounded-xl border-2 text-center transition-all font-semibold ${settings.difficulty === diff
                        ? `${difficultyButtonStyles[diff].active} shadow-sm`
                        : `${difficultyButtonStyles[diff].inactive} bg-white dark:bg-zinc-800`
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Filter by region for focused practice, or select Any to randomize.
                </p>
              </div>

              <hr className="border-gray-100 dark:border-zinc-700" />

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Appearance</h3>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Theme Mode</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{isDarkMode ? 'Dark' : 'Light'}</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Gameplay</h3>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                      {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Sound Effects</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Toggle UI sounds; logos are visual-only.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings('soundEnabled', !settings.soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.soundEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Card Animation</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Animate image transitions.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings('animationEnabled', !settings.animationEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.animationEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.animationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((card) => (
                  <div key={card.label} className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">{card.label}</p>
                    <p className={`text-2xl font-black ${card.accent}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Session stats</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Seen {sessionStats.systemsSeen} systems · {sessionStats.hintsUsed} hints · {sessionStats.livesLost} lives spent
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Recent games</h4>
                <div className="space-y-2">
                  {recentGames.length === 0 && <p className="text-xs text-gray-500">No games yet.</p>}
                  {recentGames.map((game) => (
                    <div key={game.id} className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Score {game.score}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(game.timestamp)}</p>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${difficultyColors[game.difficulty]}`}>
                      {game.difficulty}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Solved {game.systemsSolved.length} systems</p>
                </div>
              ))}
            </div>
          </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Built for quick-fire transit logo recall. Drop new SVGs or PNGs into <code className="font-mono text-xs">public/images</code> and keep aliases updated in <code className="font-mono text-xs">data/data.ts</code>.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Sounds are optional for now—gameplay is centered on visuals and text clues.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Icons by Lucide, animation by Framer Motion, built with Next.js.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
