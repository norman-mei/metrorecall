
export type TransitRegion =
  | 'Any'
  | 'North America'
  | 'Europe'
  | 'Asia-Pacific'
  | 'Latin America'
  | 'Middle East & Africa';

export interface TransitSystem {
  name: string;
  region: TransitRegion;
  image: string;
  aliases?: string[];
}

export type GameStatus = 'idle' | 'playing' | 'gameover' | 'completed';

export interface GameSettings {
  animationEnabled: boolean;
  difficulty: TransitRegion;
}

export interface GameRecord {
  id: string;
  timestamp: number;
  score: number;
  difficulty: TransitRegion;
  systemsSolved: string[];
}

export interface PlayerStats {
  gamesPlayed: number;
  bestScore: number;
  totalGuesses: number;
  correctGuesses: number;
}

export interface GameState {
  status: GameStatus;
  currentSystem: TransitSystem | null;
  score: number;
  lives: number;
  history: string[]; // Names of correctly guessed systems
  seen: string[]; // Names of systems seen in the current run
  message: string | null;
  hintsRemaining: number;
}
