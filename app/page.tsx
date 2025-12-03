'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, History, Lightbulb, RefreshCw, Settings, Trash2, Trophy, XCircle } from 'lucide-react';
import { TRANSIT_SYSTEMS } from '@/data/data';

import SettingsModal from '@/components/SettingsModal';
import PasswordModal from '@/components/PasswordModal';
import GameControls from '@/components/GameControls';
import { TransitCard } from '@/components/InstrumentCard';
import { checkGuess, findSystemByName, getRandomSystem, normalizeString } from '@/utils/gameLogic';
import { GameRecord, GameSettings, GameState, PlayerStats, TransitSystem, TransitRegion } from '@/types';

const INITIAL_LIVES = 5;
const MAX_HINTS = 3;

type SessionEntry = {
  name: string;
  region: TransitRegion;
  image: string;
  livesLost: number;
  hintsUsed: number;
  scoreAfter: number;
  outcome: 'solved' | 'skipped' | 'failed' | 'unfinished';
};

const DEFAULT_SETTINGS: GameSettings = {
  animationEnabled: true,
  difficulty: 'Any',
};

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  bestScore: 0,
  totalGuesses: 0,
  correctGuesses: 0,
};

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

const persistLocalStorage = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write errors (e.g., private mode)
  }
};

export default function Page() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [inputStr, setInputStr] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState('recent');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(() => {
    const stored = readLocalStorage('transit-settings', DEFAULT_SETTINGS);
    const storedDifficulty = readLocalStorage<TransitRegion>(
      'transit-last-difficulty',
      stored.difficulty ?? DEFAULT_SETTINGS.difficulty,
    );
    return { ...DEFAULT_SETTINGS, ...stored, difficulty: storedDifficulty };
  });
  const [stats, setStats] = useState<PlayerStats>(() =>
    readLocalStorage('transit-stats', DEFAULT_STATS),
  );
  const [gameHistory, setGameHistory] = useState<GameRecord[]>(() =>
    readLocalStorage('transit-history', []),
  );

const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    currentSystem: null,
    score: 0,
    lives: INITIAL_LIVES,
    history: [],
    seen: [],
    message: null,
    hintsRemaining: MAX_HINTS,
  });

  const [feedbackState, setFeedbackState] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>(() =>
    readLocalStorage('transit-session-history', []),
  );
  const [roundStats, setRoundStats] = useState<{ livesLost: number; hintsUsed: number }>({ livesLost: 0, hintsUsed: 0 });
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);
  const [isSolutionRevealed, setIsSolutionRevealed] = useState(false);
  const [isProcessingGuess, setIsProcessingGuess] = useState(false);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const autoAdvanceIntervalRef = useRef<number | null>(null);
  const skipClickRef = useRef<number | null>(null);

  useEffect(() => {
    persistLocalStorage('transit-settings', settings);
  }, [settings]);

  useEffect(() => {
    persistLocalStorage('transit-last-difficulty', settings.difficulty);
  }, [settings.difficulty]);

  useEffect(() => {
    persistLocalStorage('transit-stats', stats);
  }, [stats]);

  useEffect(() => {
    persistLocalStorage('transit-history', gameHistory);
  }, [gameHistory]);

  useEffect(() => {
    persistLocalStorage('transit-session-history', sessionHistory);
  }, [sessionHistory]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (gameState.status === 'idle') {
      startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = () => {
    clearAutoAdvance();
    const firstSystem = getRandomSystem([], settings.difficulty);
    setGameState({
      status: 'playing',
      currentSystem: firstSystem,
      score: 0,
      lives: INITIAL_LIVES,
      history: [],
      seen: firstSystem ? [firstSystem.name] : [],
      message: null,
      hintsRemaining: MAX_HINTS,
    });
    setFeedbackState('none');
    setInputStr('');
    setRoundStats({ livesLost: 0, hintsUsed: 0 });
    setIsSolutionRevealed(false);
    setIsPasswordModalOpen(false);
    setIsProcessingGuess(false);
  };

  const useHint = () => {
    if (gameState.hintsRemaining <= 0 || !gameState.currentSystem) return;

    const targetName = gameState.currentSystem.name;
    const normalizedTarget = normalizeString(targetName);
    const normalizedInput = normalizeString(inputStr);

    let prefixLen = 0;
    for (let i = 0; i < normalizedInput.length; i++) {
      if (i < normalizedTarget.length && normalizedInput[i] === normalizedTarget[i]) {
        prefixLen++;
      } else {
        break;
      }
    }

    const nextCharIndex = prefixLen;
    if (nextCharIndex < targetName.length) {
      const nextSub = targetName.substring(0, nextCharIndex + 1);
      setInputStr(nextSub);

      setGameState((prev) => ({
        ...prev,
        hintsRemaining: prev.hintsRemaining - 1,
      }));
      setRoundStats((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    }
  };

  const handleGuess = (e: FormEvent) => {
    e.preventDefault();
    if (!inputStr.trim() || gameState.status !== 'playing' || !gameState.currentSystem || isProcessingGuess) return;

    const isCorrect = checkGuess(inputStr, gameState.currentSystem);

    if (isCorrect) {
      handleCorrectGuess();
    } else {
      handleIncorrectGuess();
    }
  };

  const handleCorrectGuess = () => {
    if (!gameState.currentSystem || isProcessingGuess) return;
    setIsProcessingGuess(true);
    clearAutoAdvance();
    const completedSystem = gameState.currentSystem;
    const statsSnapshot = { ...roundStats };
    const nextScore = gameState.score + 1;

    setStats((prev) => ({
      ...prev,
      correctGuesses: prev.correctGuesses + 1,
      totalGuesses: prev.totalGuesses + 1,
    }));
    setFeedbackState('correct');

    setTimeout(() => {
      setSessionHistory((prev) => [
        ...prev,
        {
          name: completedSystem.name,
          region: completedSystem.region,
          image: completedSystem.image,
          livesLost: statsSnapshot.livesLost,
          hintsUsed: statsSnapshot.hintsUsed,
          scoreAfter: nextScore,
          outcome: 'solved',
        },
      ]);
      setRoundStats({ livesLost: 0, hintsUsed: 0 });
      setGameState((prev) => {
        const pool =
          settings.difficulty === 'Any'
            ? TRANSIT_SYSTEMS
            : TRANSIT_SYSTEMS.filter((i) => i.region === settings.difficulty);
        const newHistory = [...prev.history, prev.currentSystem!.name];
        const newSeen = Array.from(new Set([...prev.seen, prev.currentSystem!.name]));

        if (newSeen.length >= pool.length) {
          finalizeGame({
            ...prev,
            score: prev.score + 1,
            history: newHistory,
            seen: newSeen,
            message: 'You reached the end! Congrats!',
            status: 'completed',
            currentSystem: null,
          });
          return {
            ...prev,
            status: 'completed',
            score: prev.score + 1,
            history: newHistory,
            seen: newSeen,
            currentSystem: null,
            message: 'You reached the end! Congrats!',
          };
        }

        const nextSystem = getRandomSystem(newSeen, settings.difficulty);
        return {
          ...prev,
          score: prev.score + 1,
          history: newHistory,
          seen: newSeen,
          currentSystem: nextSystem,
          message: 'Correct!',
        };
      });
      setFeedbackState('none');
      setInputStr('');
      setIsSolutionRevealed(false);
      setIsProcessingGuess(false);
    }, 800);
  };

  const handleIncorrectGuess = () => {
    if (isProcessingGuess) return;
    setIsProcessingGuess(true);
    clearAutoAdvance();
    setFeedbackState('incorrect');
    const newLivesLost = roundStats.livesLost + 1;
    setRoundStats((prev) => ({ ...prev, livesLost: newLivesLost }));
    setStats((prev) => ({ ...prev, totalGuesses: prev.totalGuesses + 1 }));

    setTimeout(() => {
      setGameState((prev) => {
        const updatedLives = prev.lives - 1;
        if (updatedLives <= 0) {
          if (prev.currentSystem) {
            setSessionHistory((hist) => [
              ...hist,
              {
                name: prev.currentSystem!.name,
                region: prev.currentSystem!.region,
                image: prev.currentSystem!.image,
                livesLost: newLivesLost,
                hintsUsed: roundStats.hintsUsed,
                scoreAfter: prev.score,
                outcome: 'failed',
              },
            ]);
          }
          finalizeGame({ ...prev, lives: 0, status: 'gameover' });
          setIsProcessingGuess(false);
          return { ...prev, status: 'gameover', lives: 0 };
        }
        return { ...prev, lives: updatedLives };
      });
      setIsProcessingGuess(false);
      setFeedbackState('none');
    }, 600);
  };

  const finalizeGame = (finalState: GameState) => {
    const record: GameRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      score: finalState.score,
      difficulty: settings.difficulty,
      systemsSolved: finalState.history,
    };

    setGameHistory((prev) => [...prev, record]);

    setStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      bestScore: Math.max(prev.bestScore, finalState.score),
    }));
  };

  useEffect(() => {
    if (gameState.status === 'gameover' && gameState.score > 5) {
      import('canvas-confetti')
        .then(({ default: confetti }) =>
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          }),
        )
        .catch(() => null);
    }
  }, [gameState.status, gameState.score]);

  const skipSystem = () => {
    clearAutoAdvance();
    setGameState((prev) => {
      if (prev.status !== 'playing' || !prev.currentSystem) return prev;
      const updatedSeen = Array.from(new Set([...prev.seen, prev.currentSystem.name]));
      const pool =
        settings.difficulty === 'Any'
          ? TRANSIT_SYSTEMS
          : TRANSIT_SYSTEMS.filter((i) => i.region === settings.difficulty);
      if (updatedSeen.length >= pool.length) {
        finalizeGame({
          ...prev,
          seen: updatedSeen,
          currentSystem: null,
          message: 'You reached the end! Congrats!',
          status: 'completed',
        });
        return {
          ...prev,
          seen: updatedSeen,
          status: 'completed',
          currentSystem: null,
          message: 'You reached the end! Congrats!',
        };
      }
      const nextSystem = getRandomSystem(updatedSeen, settings.difficulty);
      setSessionHistory((hist) => [
        ...hist,
        {
          name: prev.currentSystem!.name,
          region: prev.currentSystem!.region,
          image: prev.currentSystem!.image,
          livesLost: roundStats.livesLost,
          hintsUsed: roundStats.hintsUsed,
          scoreAfter: prev.score,
          outcome: 'skipped',
        },
      ]);
      setRoundStats({ livesLost: 0, hintsUsed: 0 });
      return {
        ...prev,
        currentSystem: nextSystem,
        message: 'Skipped',
        history: prev.history,
        seen: updatedSeen,
      };
    });
    setFeedbackState('none');
    setInputStr('');
    setIsSolutionRevealed(false);
    setIsProcessingGuess(false);
  };

  const handleSkipClick = () => {
    const now = Date.now();
    if (skipClickRef.current && now - skipClickRef.current <= 3000) {
      skipClickRef.current = null;
      skipSystem();
      return;
    }
    skipClickRef.current = now;
    window.setTimeout(() => {
      if (skipClickRef.current === now) {
        skipClickRef.current = null;
      }
    }, 3000);
  };

  const clearAutoAdvance = () => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }
    setAutoAdvanceSeconds(null);
  };

  useEffect(() => {
    const detected =
      gameState.status === 'playing' &&
      gameState.currentSystem &&
      checkGuess(inputStr, gameState.currentSystem);

    if (detected) {
      if (!autoAdvanceTimeoutRef.current) {
        const deadline = Date.now() + 8000;
        setAutoAdvanceSeconds(8);
        setFeedbackState('correct');
        autoAdvanceTimeoutRef.current = window.setTimeout(() => {
          clearAutoAdvance();
          if (
            gameState.status === 'playing' &&
            gameState.currentSystem &&
            checkGuess(inputStr, gameState.currentSystem)
          ) {
            handleCorrectGuess();
          }
        }, 8000);
        autoAdvanceIntervalRef.current = window.setInterval(() => {
          const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
          setAutoAdvanceSeconds(remaining === 0 ? null : remaining);
        }, 500);
      }
    } else {
      clearAutoAdvance();
      if (autoAdvanceSeconds !== null && feedbackState === 'correct') {
        setFeedbackState('none');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputStr, gameState.currentSystem, gameState.status]);

  const handleManualAdvance = () => {
    clearAutoAdvance();
    if (
      gameState.status === 'playing' &&
      gameState.currentSystem &&
      checkGuess(inputStr, gameState.currentSystem)
    ) {
      handleCorrectGuess();
    }
  };

  const [isLoadedSolved, setIsLoadedSolved] = useState(false);

  const loadSystem = (name: string, region: TransitRegion, image: string, outcome: string) => {
    const systemToLoad: TransitSystem =
      findSystemByName(name) ?? {
        name,
        region,
        image,
      };

    if (gameState.status === 'playing' && gameState.currentSystem && gameState.currentSystem.name !== name) {
      const current = gameState.currentSystem;
      const statsSnapshot = { ...roundStats };
      setSessionHistory((prev) => [
        ...prev,
        {
          name: current.name,
          region: current.region,
          image: current.image,
          livesLost: statsSnapshot.livesLost,
          hintsUsed: statsSnapshot.hintsUsed,
          scoreAfter: gameState.score,
          outcome: 'unfinished',
        },
      ]);
      setRoundStats({ livesLost: 0, hintsUsed: 0 });
    }

    const isSolved = outcome === 'solved';
    setIsLoadedSolved(isSolved);

    setGameState((prev) => ({
      ...prev,
      status: 'playing',
      currentSystem: systemToLoad,
      message: isSolved ? 'Loaded from history' : 'Unfinished',
      hintsRemaining: MAX_HINTS,
      lives: prev.lives > 0 ? prev.lives : 1,
      seen: Array.from(new Set([...prev.seen, systemToLoad.name])),
    }));
    setIsProcessingGuess(false);

    if (isSolved) {
      setFeedbackState('correct');
      setInputStr('You already solved this logo!');
    } else {
      setFeedbackState('none');
      setInputStr('');
    }
    setIsHistoryOpen(false);
  };

  const difficultyColors: Record<TransitRegion, string> = {
    Any: 'text-gray-600 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-200',
    'North America': 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
    Europe: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300',
    'Asia-Pacific': 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300',
    'Latin America': 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Middle East & Africa': 'text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300',
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredAndSortedHistory = useMemo(() => {
    const filtered = sessionHistory.filter((entry) => {
      if (!historySearch) return true;
      const normalizeForSearch = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const searchNorm = normalizeForSearch(historySearch);
      const nameNorm = normalizeForSearch(entry.name);
      const regionNorm = normalizeForSearch(entry.region);

      return nameNorm.includes(searchNorm) || regionNorm.includes(searchNorm);
    });

    let sorted = [...filtered];
    if (historySort === 'recent') {
      sorted.reverse();
    } else if (historySort === 'a-z') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (historySort === 'z-a') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (historySort === 'status-desc') {
      const priority = { unfinished: 0, skipped: 1, failed: 2, solved: 3 };
      sorted.sort((a, b) => priority[a.outcome] - priority[b.outcome]);
    } else if (historySort === 'status-asc') {
      const priority = { solved: 0, failed: 1, skipped: 2, unfinished: 3 };
      sorted.sort((a, b) => priority[a.outcome] - priority[b.outcome]);
    }
    return sorted;
  }, [sessionHistory, historySearch, historySort]);

  const wrongGuesses = Math.max(stats.totalGuesses - stats.correctGuesses, 0);

  const averageScore = useMemo(() => {
    if (gameHistory.length === 0) return 0;
    const totalScore = gameHistory.reduce((sum, game) => sum + game.score, 0);
    return totalScore / gameHistory.length;
  }, [gameHistory]);

  const averageGuessesPerGame = useMemo(() => {
    if (stats.gamesPlayed === 0) return 0;
    return stats.totalGuesses / stats.gamesPlayed;
  }, [stats.gamesPlayed, stats.totalGuesses]);

  const recentGames = useMemo(
    () => [...gameHistory].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3),
    [gameHistory],
  );

  const sessionStats = useMemo(() => {
    const totals = sessionHistory.reduce(
      (acc, entry) => {
        acc.systemsSeen += 1;
        acc.hintsUsed += entry.hintsUsed;
        acc.livesLost += entry.livesLost;
        return acc;
      },
      { systemsSeen: 0, hintsUsed: 0, livesLost: 0 },
    );

    return {
      systemsSeen: totals.systemsSeen + (gameState.status === 'playing' ? 1 : 0),
      hintsUsed: totals.hintsUsed + roundStats.hintsUsed,
      livesLost: totals.livesLost + roundStats.livesLost,
    };
  }, [sessionHistory, roundStats, gameState.status]);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-100 transition-colors duration-500 font-sans flex flex-col overflow-hidden">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        settings={settings}
        updateSettings={(k, v) => setSettings((prev) => ({ ...prev, [k]: v }))}
        stats={stats}
        currentStreak={gameState.score}
        averageScore={averageScore}
        averageGuessesPerGame={averageGuessesPerGame}
        wrongGuesses={wrongGuesses}
        recentGames={recentGames}
        sessionStats={sessionStats}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setIsSolutionRevealed(true);
          setInputStr(gameState.currentSystem?.name ?? '');
          setFeedbackState('correct');
        }}
      />

      <header className="absolute top-0 w-full p-6 flex justify-end items-start z-40 pointer-events-none">
        <div className="pointer-events-auto relative flex items-center justify-end gap-3">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="group flex items-center gap-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 transition-all duration-300 ease-out hover:pr-6 hover:ring-4 ring-blue-500/20"
            title="History"
          >
            <History className="w-6 h-6 text-gray-700 dark:text-gray-200 transition-transform duration-500 group-hover:-rotate-90" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-200 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-500 ease-in-out">
              History
            </span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="group flex items-center gap-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 transition-all duration-300 ease-out hover:pr-6 hover:ring-4 ring-blue-500/20"
          >
            <Settings className="w-6 h-6 text-gray-700 dark:text-gray-200 transition-transform duration-500 group-hover:rotate-180" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold text-gray-700 dark:text-gray-200 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-500 ease-in-out">
              Settings
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative p-4">
        <AnimatePresence mode="wait">
          {gameState.status === 'playing' && gameState.currentSystem && (
            <motion.div
              key="playing"
              {...({
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 1.05 },
              } as any)}
              className="w-full max-w-[1400px] grid xl:grid-cols-[1.2fr_minmax(360px,0.8fr)] gap-6 items-start z-10 px-2 md:px-4"
            >
              <div className="flex-1 flex flex-col gap-6 min-w-0">
                <TransitCard system={gameState.currentSystem} />
              </div>
              <div className="flex-1">
                <GameControls
                  gameState={gameState}
                  inputStr={inputStr}
                  setInputStr={setInputStr}
                  handleGuess={handleGuess}
                  useHint={useHint}
                  feedbackState={feedbackState}
                  autoAdvanceSeconds={autoAdvanceSeconds}
                  handleSkipClick={handleSkipClick}
                  onShowSolution={() => setIsPasswordModalOpen(true)}
                  INITIAL_LIVES={INITIAL_LIVES}
                  MAX_HINTS={MAX_HINTS}
                  isLoadedSolved={isLoadedSolved}
                  isSolutionRevealed={isSolutionRevealed}
                  onManualAdvance={handleManualAdvance}
                />
              </div>
            </motion.div>
          )}

          {gameState.status === 'gameover' && (
            <motion.div
              key="gameover"
              {...({
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
              } as any)}
              className="text-center z-10"
            >
              <div className="bg-white dark:bg-zinc-800 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-700 max-w-lg mx-auto">
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">You ran out of lives.</p>

                <div className="py-8 px-12 bg-gray-50 dark:bg-zinc-700/50 rounded-2xl mb-8 border border-dashed border-gray-200 dark:border-zinc-600">
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-2">Final Score</p>
                  <p className="text-6xl font-black text-blue-600 dark:text-blue-400">{gameState.score}</p>
                </div>

                <div className="mb-8">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Identified systems:</p>
                  <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto custom-scrollbar">
                    {gameState.history.map((op, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded"
                      >
                        {op}
                      </span>
                    ))}
                    {gameState.history.length === 0 && (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="w-full px-8 py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} /> Try Again
                </button>
              </div>
            </motion.div>
          )}

          {gameState.status === 'completed' && (
            <motion.div
              key="completed"
              {...({
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
              } as any)}
              className="text-center z-10"
            >
              <div className="bg-white dark:bg-zinc-800 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-700 max-w-lg mx-auto">
                <h2 className="text-3xl font-bold mb-2">All caught up!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">You reached the end of the logo deck.</p>

                <div className="py-8 px-12 bg-gray-50 dark:bg-zinc-700/50 rounded-2xl mb-8 border border-dashed border-gray-200 dark:border-zinc-600">
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-2">Final Score</p>
                  <p className="text-6xl font-black text-green-600 dark:text-green-400">{gameState.score}</p>
                </div>

                <div className="mb-8">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Systems seen:</p>
                  <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto custom-scrollbar">
                    {gameState.seen.map((op, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded"
                      >
                        {op}
                      </span>
                    ))}
                    {gameState.seen.length === 0 && (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="w-full px-8 py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} /> Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {gameState.status === 'playing' && !gameState.currentSystem && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-6">
            <p>Loading next system...</p>
          </div>
        )}

        {isHistoryOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsHistoryOpen(false)}
          >
            <div
              className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-500" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">History</h3>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div className="px-6 pt-4 shrink-0 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                  </div>
                  <select
                    value={historySort}
                    onChange={(e) => setHistorySort(e.target.value)}
                    className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="recent">Recent</option>
                    <option value="a-z">A-Z</option>
                    <option value="z-a">Z-A</option>
                    <option value="status-desc">Status (Priority)</option>
                    <option value="status-asc">Status (Solved)</option>
                  </select>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {sessionHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                    No systems played in this session yet.
                  </p>
                ) : (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => setSessionHistory([])}
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors flex items-center gap-1.5 font-medium"
                      title="Clear History"
                    >
                      <Trash2 size={14} />
                      Clear History
                    </button>
                  </div>
                )}
                {filteredAndSortedHistory.map((entry, idx) => (
                  <div key={`${entry.name}-${idx}`} className="group">
                    <div className="flex flex-col gap-3 py-2">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${entry.outcome === 'solved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : entry.outcome === 'skipped'
                                ? 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400'
                                : entry.outcome === 'unfinished'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                          >
                            {entry.outcome}
                          </span>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${difficultyColors[entry.region]}`}>
                              {entry.region}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {entry.outcome === 'solved' ? entry.name : '???'}
                          </h4>
                        </div>

                        <button
                          onClick={() => loadSystem(entry.name, entry.region, entry.image, entry.outcome)}
                          disabled={gameState.currentSystem?.name === entry.name}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${gameState.currentSystem?.name === entry.name
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800 dark:text-gray-500'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                            }`}
                        >
                          {gameState.currentSystem?.name === entry.name ? 'Loaded' : 'Load'}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 justify-end">
                        <div className="flex items-center gap-3 ml-auto">
                          {entry.livesLost > 0 && (
                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                              <Heart size={12} className="fill-current" /> -{entry.livesLost}
                            </span>
                          )}
                          {entry.hintsUsed > 0 && (
                            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                              <Lightbulb size={12} className="fill-current" /> {entry.hintsUsed}
                            </span>
                          )}
                          <span className="font-mono opacity-60">
                            Score: {entry.scoreAfter}
                          </span>
                        </div>
                      </div>
                    </div>
                    {idx < filteredAndSortedHistory.length - 1 && (
                      <hr className="border-gray-100 dark:border-zinc-800 mt-2" />
                    )}
                  </div>
                ))}
              </div >
            </div >
          </div >
        )
        }

        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl dark:bg-blue-500/5"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl dark:bg-purple-500/5"></div>
        </div>
      </main >
    </div >
  );
}
