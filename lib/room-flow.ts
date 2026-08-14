import { GAMES, type GameId, type Locale, type TimePreset } from './product';

// Release 1 public contexts. A dedicated child-directed Kids context is intentionally deferred
// until the corresponding children/privacy review is complete.
export const GROUP_CONTEXTS = ['Classroom', 'Friends', 'Family', 'Workplace', 'Mixed Group'] as const;
export type GroupContext = (typeof GROUP_CONTEXTS)[number];
export type RankingVisibility = 'podium' | 'top10' | 'public' | 'private';

export type HostRoomDraft = {
  minutes: TimePreset;
  context: GroupContext | null;
  gameId: GameId;
  hostCap: number | null;
  roomLanguage: Locale;
  allowCustomPhotos: boolean;
  allowLateJoin: boolean;
  rankingVisibility: RankingVisibility;
};

export type Readiness = {
  state: 'below-minimum' | 'ready' | 'above-limit' | 'missing-setup' | 'reconnecting';
  canStart: boolean;
  message: string;
};

export type Avatar = {
  id: string;
  category: 'chinese-zodiac' | 'western-zodiac' | 'animals' | 'vegetables' | 'fruits';
  label: string;
  emoji: string;
};

const makeAvatars = (
  category: Avatar['category'],
  items: readonly [string, string][],
): Avatar[] => items.map(([label, emoji]) => ({ id: `${category}:${label.toLowerCase().replaceAll(' ', '-')}`, category, label, emoji }));

export const AVATARS: Avatar[] = [
  ...makeAvatars('chinese-zodiac', [
    ['Rat','🐀'],['Ox','🐂'],['Tiger','🐅'],['Rabbit','🐇'],['Dragon','🐉'],['Snake','🐍'],
    ['Horse','🐎'],['Goat','🐐'],['Monkey','🐒'],['Rooster','🐓'],['Dog','🐕'],['Pig','🐖'],
  ]),
  ...makeAvatars('western-zodiac', [
    ['Aries','♈'],['Taurus','♉'],['Gemini','♊'],['Cancer','♋'],['Leo','♌'],['Virgo','♍'],
    ['Libra','♎'],['Scorpio','♏'],['Sagittarius','♐'],['Capricorn','♑'],['Aquarius','♒'],['Pisces','♓'],
  ]),
  ...makeAvatars('animals', [
    ['Panda','🐼'],['Fox','🦊'],['Owl','🦉'],['Dolphin','🐬'],['Koala','🐨'],['Penguin','🐧'],
    ['Lion','🦁'],['Otter','🦦'],['Turtle','🐢'],['Elephant','🐘'],['Bear','🐻'],['Cat','🐱'],
  ]),
  ...makeAvatars('vegetables', [
    ['Carrot','🥕'],['Broccoli','🥦'],['Corn','🌽'],['Pepper','🫑'],['Eggplant','🍆'],['Pea','🫛'],
    ['Pumpkin','🎃'],['Potato','🥔'],['Radish','🫜'],['Cucumber','🥒'],['Mushroom','🍄'],['Garlic','🧄'],
  ]),
  ...makeAvatars('fruits', [
    ['Apple','🍎'],['Banana','🍌'],['Mango','🥭'],['Orange','🍊'],['Strawberry','🍓'],['Grapes','🍇'],
    ['Pineapple','🍍'],['Watermelon','🍉'],['Peach','🍑'],['Cherry','🍒'],['Kiwi','🥝'],['Lemon','🍋'],
  ]),
];

const ADJECTIVES = ['Brave','Lucky','Cosmic','Bright','Swift','Happy','Clever','Sunny','Kind','Mighty','Playful','Calm'] as const;

export function normalizeRoomCode(value: string) {
  return value.normalize('NFKC').toUpperCase().replace(/[\s_-]+/g, '').replace(/[^A-Z0-9]/g, '');
}

export function getGame(gameId: GameId) {
  const game = GAMES.find((item) => item.id === gameId);
  if (!game) throw new Error(`Unknown game: ${gameId}`);
  return game;
}

export function gamesForTime(minutes: TimePreset) {
  return GAMES.filter((game) => game.times.includes(minutes));
}

export function evaluateReadiness(options: {
  gameId: GameId;
  activePlayers: number;
  hostCap?: number | null;
  setupComplete?: boolean;
  reconnectingPlayers?: number;
}): Readiness {
  const { gameId, activePlayers, hostCap = null, setupComplete = true, reconnectingPlayers = 0 } = options;
  const game = getGame(gameId);

  if (!setupComplete) return { state: 'missing-setup', canStart: false, message: 'Complete the required game setup before starting.' };
  if (activePlayers < game.hardMin) {
    const missing = game.hardMin - activePlayers;
    return { state: 'below-minimum', canStart: false, message: `${missing} more player${missing === 1 ? '' : 's'} required.` };
  }
  if (game.hardMax !== null && activePlayers > game.hardMax) {
    const excess = activePlayers - game.hardMax;
    return { state: 'above-limit', canStart: false, message: `Move ${excess} player${excess === 1 ? '' : 's'} to spectators or choose another game.` };
  }
  if (hostCap !== null && activePlayers > hostCap) {
    const excess = activePlayers - hostCap;
    return { state: 'above-limit', canStart: false, message: `Move ${excess} player${excess === 1 ? '' : 's'} to spectators or raise the host participant cap.` };
  }
  if (reconnectingPlayers > 0) {
    return {
      state: 'reconnecting',
      canStart: true,
      message: `${reconnectingPlayers} player${reconnectingPlayers === 1 ? '' : 's'} reconnecting; seat${reconnectingPlayers === 1 ? '' : 's'} reserved during the grace period.`,
    };
  }
  return { state: 'ready', canStart: true, message: 'Ready to start.' };
}

export function generateNickname(avatar: Avatar, variant = 0) {
  const preferred = avatar.label === 'Tiger' ? 'Brave' : avatar.label === 'Mango' ? 'Lucky' : avatar.label === 'Aries' ? 'Cosmic' : ADJECTIVES[(AVATARS.findIndex((item) => item.id === avatar.id) + variant) % ADJECTIVES.length];
  return `${preferred} ${avatar.label}`;
}

export function disambiguateNickname(candidate: string, existing: readonly string[]) {
  const normalized = new Set(existing.map((name) => name.trim().toLocaleLowerCase('en')));
  if (!normalized.has(candidate.trim().toLocaleLowerCase('en'))) return candidate;
  let suffix = 2;
  while (normalized.has(`${candidate} ${suffix}`.toLocaleLowerCase('en'))) suffix += 1;
  return `${candidate} ${suffix}`;
}

export function nicknameIssue(value: string, classroomSafe = false): string | null {
  const name = value.trim();
  if (name.length < 2) return 'Nickname must be at least 2 characters.';
  if (name.length > 24) return 'Nickname must be 24 characters or fewer.';
  if (classroomSafe && /(https?:\/\/|www\.)/i.test(name)) return 'Links are not allowed in Classroom mode.';
  if (classroomSafe && /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(name)) return 'Contact information is not allowed in Classroom mode.';
  if (classroomSafe && /(?:\+?\d[\s().-]*){8,}/.test(name)) return 'Contact information is not allowed in Classroom mode.';
  return null;
}
