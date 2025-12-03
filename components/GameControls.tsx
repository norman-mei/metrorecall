import React, { FormEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { GameState } from '@/types';

interface GameControlsProps {
  gameState: GameState;
  inputStr: string;
  setInputStr: (val: string) => void;
  handleGuess: (e: FormEvent) => void;
  useHint: () => void;
  feedbackState: 'none' | 'correct' | 'incorrect';
  autoAdvanceSeconds: number | null;
  handleSkipClick: () => void;
  onShowSolution: () => void;
  INITIAL_LIVES: number;
  MAX_HINTS: number;
  isLoadedSolved: boolean;
  isSolutionRevealed: boolean;
  onManualAdvance: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  inputStr,
  setInputStr,
  handleGuess,
  useHint,
  feedbackState,
  autoAdvanceSeconds,
  handleSkipClick,
  onShowSolution,
  INITIAL_LIVES,
  MAX_HINTS,
  isLoadedSolved,
  isSolutionRevealed,
  onManualAdvance,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputStr]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGuess(e as any);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="pointer-events-auto">
        <div className="flex items-center gap-3">
          <Image
            src="/images/favicon.ico"
            alt="Transit Recall"
            width={36}
            height={36}
            className="rounded-md"
          />
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white drop-shadow-sm">
            Metro <span className="text-blue-600 dark:text-blue-400">Recall</span>
          </h2>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-zinc-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Can you name the transit system?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Study the logo, type the agency name or nickname, hit Enter. Region filter controls the challenge.
        </p>
        {gameState.message === 'Unfinished' && (
          <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mt-2">Unfinished</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-zinc-700 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Score</p>
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{gameState.score}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-zinc-700 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Lives</p>
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(INITIAL_LIVES)].map((_, i) => (
              <Heart
                key={i}
                size={20}
                className={`transition-all duration-300 ${
                  i < gameState.lives
                    ? 'fill-red-500 text-red-500'
                    : 'fill-gray-200 dark:fill-zinc-700 text-gray-200 dark:text-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-zinc-700 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Hints</p>
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(MAX_HINTS)].map((_, i) => (
              <Lightbulb
                key={i}
                size={20}
                className={`transition-all duration-300 ${
                  i < gameState.hintsRemaining
                    ? 'fill-yellow-400 text-yellow-500'
                    : 'fill-gray-200 dark:fill-zinc-700 text-gray-200 dark:text-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full">
        <form onSubmit={handleGuess} className="relative">
          <motion.div
            {...({
              animate: feedbackState === 'incorrect' ? { x: [-10, 10, -10, 10, 0] } : {},
              transition: { duration: 0.4 },
            } as any)}
          >
            <div
              className={`relative bg-white dark:bg-zinc-800 rounded-xl border-2 shadow-lg transition-all duration-300 overflow-hidden
              ${
                feedbackState === 'correct'
                  ? 'border-green-500'
                  : feedbackState === 'incorrect'
                  ? 'border-red-500'
                  : 'border-gray-200 dark:border-zinc-600 focus-within:border-blue-500 dark:focus-within:border-blue-400'
              }`}
            >
              <textarea
                ref={textareaRef}
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Name this transit system..."
                autoFocus
                readOnly={autoAdvanceSeconds !== null || isLoadedSolved}
                rows={1}
                className={`w-full p-5 pr-14 bg-transparent outline-none text-xl font-semibold resize-none block
                  ${
                    feedbackState === 'correct'
                      ? 'text-green-600'
                      : feedbackState === 'incorrect'
                      ? 'text-red-500'
                      : 'text-gray-900 dark:text-white'
                  }`}
                style={{ minHeight: '60px' }}
              />

              <div
                className={`absolute right-3 bottom-3 flex items-center ${
                  feedbackState === 'none' ? '' : 'gap-2'
                }`}
              >
                <button
                  type="button"
                  onClick={useHint}
                  disabled={gameState.hintsRemaining === 0 || isLoadedSolved}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Use Hint"
                >
                  <Lightbulb size={20} className={gameState.hintsRemaining > 0 ? 'fill-yellow-400' : ''} />
                </button>
                {(feedbackState === 'correct' || feedbackState === 'incorrect') && (
                  <div className="pointer-events-none w-6 h-6 flex items-center justify-center">
                    {feedbackState === 'correct' && <CheckCircle2 className="text-green-500 animate-bounce" />}
                    {feedbackState === 'incorrect' && <XCircle className="text-red-500 animate-pulse" />}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          <button type="submit" className="hidden">
            Submit
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4 space-y-1">
          {autoAdvanceSeconds !== null && (
            <div className="flex items-center justify-center gap-2">
              <span className="block text-yellow-600 dark:text-yellow-400 font-semibold">
                Name detected! Auto-advancing in {autoAdvanceSeconds}s…
              </span>
              <button
                type="button"
                onClick={onManualAdvance}
                className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
              >
                Next &gt;
              </button>
            </div>
          )}
        </p>

        <div className="flex flex-col items-center gap-2 mt-4">
          <button
            type="button"
            onClick={handleSkipClick}
            disabled={gameState.status !== 'playing' || isLoadedSolved}
            className="w-full px-4 py-2 rounded-lg border border-red-700 bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Double-click within 3 seconds to skip"
          >
            Skip Logo
          </button>

          <button
            type="button"
            onClick={onShowSolution}
            disabled={isLoadedSolved || isSolutionRevealed}
            className="w-full px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-sm font-semibold text-blue-600 dark:text-blue-400 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Show Solution
          </button>

          <span className="text-xs text-gray-400 text-center mt-1">
            Double-click &apos;Skip&apos; to move on.
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
