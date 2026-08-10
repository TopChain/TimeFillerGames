// Starter engineering content for Release 1 integration testing.
// The Product Plan specifies configurable word category/difficulty but not final launch vocabulary.
// Replace/expand this bank during content QA before publication.

export type QuickDrawCategory = 'Everyday' | 'Animals' | 'Food' | 'Places';
export type QuickDrawDifficulty = 'easy' | 'medium' | 'hard';

export type QuickDrawWord = {
  id: string;
  category: QuickDrawCategory;
  difficulty: QuickDrawDifficulty;
  word: string;
};

export const QUICK_DRAW_WORDS: QuickDrawWord[] = [
  { id: 'e01', category: 'Everyday', difficulty: 'easy', word: 'umbrella' },
  { id: 'e02', category: 'Everyday', difficulty: 'easy', word: 'bicycle' },
  { id: 'e03', category: 'Everyday', difficulty: 'easy', word: 'key' },
  { id: 'e04', category: 'Everyday', difficulty: 'medium', word: 'headphones' },
  { id: 'e05', category: 'Everyday', difficulty: 'medium', word: 'flashlight' },
  { id: 'e06', category: 'Everyday', difficulty: 'hard', word: 'hourglass' },

  { id: 'a01', category: 'Animals', difficulty: 'easy', word: 'cat' },
  { id: 'a02', category: 'Animals', difficulty: 'easy', word: 'elephant' },
  { id: 'a03', category: 'Animals', difficulty: 'medium', word: 'penguin' },
  { id: 'a04', category: 'Animals', difficulty: 'medium', word: 'octopus' },
  { id: 'a05', category: 'Animals', difficulty: 'hard', word: 'chameleon' },
  { id: 'a06', category: 'Animals', difficulty: 'hard', word: 'porcupine' },

  { id: 'f01', category: 'Food', difficulty: 'easy', word: 'pizza' },
  { id: 'f02', category: 'Food', difficulty: 'easy', word: 'banana' },
  { id: 'f03', category: 'Food', difficulty: 'medium', word: 'cupcake' },
  { id: 'f04', category: 'Food', difficulty: 'medium', word: 'sandwich' },
  { id: 'f05', category: 'Food', difficulty: 'hard', word: 'spaghetti' },
  { id: 'f06', category: 'Food', difficulty: 'hard', word: 'pineapple' },

  { id: 'p01', category: 'Places', difficulty: 'easy', word: 'beach' },
  { id: 'p02', category: 'Places', difficulty: 'easy', word: 'school' },
  { id: 'p03', category: 'Places', difficulty: 'medium', word: 'airport' },
  { id: 'p04', category: 'Places', difficulty: 'medium', word: 'museum' },
  { id: 'p05', category: 'Places', difficulty: 'hard', word: 'lighthouse' },
  { id: 'p06', category: 'Places', difficulty: 'hard', word: 'observatory' },
];

export function quickDrawWords(category: QuickDrawCategory, difficulty: QuickDrawDifficulty) {
  return QUICK_DRAW_WORDS.filter((item) => item.category === category && item.difficulty === difficulty);
}
