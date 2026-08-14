import { describe, expect, it } from 'vitest';
import { MAJORITY_QUESTIONS, type MajorityCategory } from '../lib/majority-match-content';
import { QUICK_DRAW_WORDS, type QuickDrawCategory, type QuickDrawDifficulty } from '../lib/quick-draw-content';

const majorityCategories: MajorityCategory[] = ['Classroom', 'Friends', 'Family', 'Workplace', 'General'];
const quickDrawCategories: QuickDrawCategory[] = ['Everyday', 'Animals', 'Food', 'Places'];
const quickDrawDifficulties: QuickDrawDifficulty[] = ['easy', 'medium', 'hard'];

describe('Release 1 curated content banks', () => {
  it('keeps a substantial and internally valid Majority Match bank', () => {
    expect(MAJORITY_QUESTIONS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(MAJORITY_QUESTIONS.map((question) => question.id)).size).toBe(MAJORITY_QUESTIONS.length);

    for (const category of majorityCategories) {
      expect(MAJORITY_QUESTIONS.filter((question) => question.category === category).length).toBeGreaterThanOrEqual(10);
    }

    for (const question of MAJORITY_QUESTIONS) {
      expect(question.prompt.trim()).toBe(question.prompt);
      expect(question.prompt.length).toBeGreaterThan(10);
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices).size).toBe(4);
      for (const choice of question.choices) {
        expect(choice.trim()).toBe(choice);
        expect(choice.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps enough Quick Draw words in every category and difficulty bucket', () => {
    expect(QUICK_DRAW_WORDS.length).toBeGreaterThanOrEqual(144);
    expect(new Set(QUICK_DRAW_WORDS.map((item) => item.id)).size).toBe(QUICK_DRAW_WORDS.length);

    for (const category of quickDrawCategories) {
      for (const difficulty of quickDrawDifficulties) {
        const bucket = QUICK_DRAW_WORDS.filter((item) => item.category === category && item.difficulty === difficulty);
        expect(bucket.length).toBeGreaterThanOrEqual(12);
      }
    }

    for (const item of QUICK_DRAW_WORDS) {
      expect(item.word.trim()).toBe(item.word);
      expect(item.word.length).toBeGreaterThan(0);
      expect(item.word).toBe(item.word.toLocaleLowerCase('en'));
    }
  });
});
