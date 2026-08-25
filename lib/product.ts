export type Locale = 'en' | 'zh-Hant' | 'zh-Hans' | 'es' | 'ja' | 'ko';
export type TimePreset = 3 | 5 | 8 | 10;
export type GameId = 'bingo' | 'majority-match' | 'quick-draw' | 'word-challenge' | 'math-challenge';

export const TIME_PRESETS: TimePreset[] = [3, 5, 8, 10];

export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'zh-Hant', label: '繁體中文' },
  { id: 'zh-Hans', label: '简体中文' },
  { id: 'es', label: 'Español' },
  { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' },
];

export const AVATAR_CATEGORIES = [
  { id: 'chinese-zodiac', label: 'Chinese zodiac', count: 12 },
  { id: 'western-zodiac', label: 'Western zodiac', count: 12 },
  { id: 'animals', label: 'Animals', count: 12 },
  { id: 'vegetables', label: 'Vegetables', count: 12 },
  { id: 'fruits', label: 'Fruits', count: 12 },
] as const;

export const GAMES = [
  {
    id: 'bingo',
    release: 'R1',
    name: 'Bingo',
    mechanic: 'Server-drawn number or people Bingo with automatic marking.',
    hardMin: 2,
    hardMax: null,
    recommended: null,
    times: [3, 5, 8, 10],
    sharedScreen: 'Optional',
    spectator: true,
    accent: 'bingo',
  },
  {
    id: 'majority-match',
    release: 'R1',
    name: 'Majority Match',
    mechanic: 'Predict which answer the room will choose most often.',
    hardMin: 3,
    hardMax: null,
    recommended: '5+',
    times: [3, 5, 8, 10],
    sharedScreen: 'Optional but useful',
    spectator: true,
    accent: 'quiz',
  },
  {
    id: 'quick-draw',
    release: 'R1',
    name: 'Quick Draw & Guess',
    mechanic: 'One player draws a secret word while the room guesses in real time.',
    hardMin: 3,
    hardMax: null,
    recommended: '4–20 active',
    times: [3, 5, 8, 10],
    sharedScreen: 'Recommended',
    spectator: true,
    accent: 'draw',
  },
  {
    id: 'word-challenge',
    release: 'R1.1',
    name: 'Word Challenge',
    mechanic: 'English vocabulary questions with CEFR-aligned A1–C2 difficulty.',
    hardMin: 2,
    hardMax: null,
    recommended: null,
    times: [3, 5, 8, 10],
    sharedScreen: 'Optional',
    spectator: false,
    accent: 'word',
  },
  {
    id: 'math-challenge',
    release: 'R1.1',
    name: 'Math Challenge',
    mechanic: 'Short competitive math play with fixed or adaptive M1–M5 bands.',
    hardMin: 2,
    hardMax: null,
    recommended: null,
    times: [3, 5, 8, 10],
    sharedScreen: 'Optional',
    spectator: false,
    accent: 'math',
  },
] as const;

export const WORD_DEFAULTS: Record<TimePreset, number> = { 3: 5, 5: 10, 8: 15, 10: 20 };
export const MATH_DEFAULTS: Record<TimePreset, number> = { 3: 6, 5: 10, 8: 16, 10: 20 };
export const BINGO_BOARDS = [
  { size: 5, label: 'Quick', normal: true, estimate: '~3 min' },
  { size: 6, label: 'Easy', normal: true, estimate: '~5 min' },
  { size: 7, label: 'Standard', normal: true, estimate: '~8 min' },
  { size: 8, label: 'Challenge', normal: true, estimate: '~10 min' },
  { size: 9, label: 'Long', normal: false, estimate: '~12–15 min' },
  { size: 10, label: 'Marathon', normal: false, estimate: '~15–18 min' },
] as const;
