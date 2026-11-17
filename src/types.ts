export type CategoryId = 'aqidah' | 'ibadah' | 'tarikh' | 'kemuhammadiyahan' | 'juzamma';
export type QType = 'mc' | 'short';
export type Difficulty = 1 | 2 | 3;

export interface Question {
  id: string;
  category: CategoryId;
  subtopic: string;
  type: QType;
  question: string;
  arabic?: string;
  latin?: string;
  meaning?: string;
  options?: string[];
  answer: string;
  aliases?: string[];
  explanation: string;
  difficulty: Difficulty;
  tag: 'lomba' | 'belajar';
  source?: 'builtin' | 'custom' | 'ai';
}

export interface CatStat { answered: number; correct: number; timeMs: number }
export type ModeId = 'latihan' | 'kuis' | 'simulasi' | 'ulangi';

export interface SessionRecord {
  id: string;
  date: string;
  mode: ModeId;
  category: CategoryId | 'campur';
  total: number;
  correct: number;
  points: number;
  durationMs: number;
  avgMs: number;
}

export interface Profile {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  totalScore: number;
  streak: number;
  bestStreak: number;
  dayStreak: number;
  lastDay?: string;
  stats: Record<CategoryId, CatStat>;
  wrong: Record<string, { count: number; last: string }>;
  history: SessionRecord[];
}

export type Tolerance = 'ketat' | 'normal' | 'longgar';

export interface Settings {
  timerSec: number;
  sound: boolean;
  offlineNotice: boolean;
  tolerance: Tolerance;
  aiCheck: boolean;
  geminiKey: string;
  geminiModel: string;
  pin: string;
}

export interface AnswerLog {
  q: Question;
  given: string;
  correct: boolean;
  timeMs: number;
  points: number;
  timedOut?: boolean;
  passed?: boolean;
  aiJudged?: boolean;
  aiNote?: string;
}

export interface SessionConfig {
  mode: ModeId;
  category: CategoryId | 'campur';
  subtopic?: string;
  difficulty: 0 | Difficulty;
  count: number;
  timerSec: number;
}
