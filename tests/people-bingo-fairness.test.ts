import { describe, expect, it } from 'vitest';
import { generatePeopleBingoCandidates } from '../lib/release1-games';

function seededRng(seed = 123456789) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('People Bingo >25 subset fairness foundation', () => {
  it('keeps every 5x5 card unique while distributing 30 eligible players across repeated cards', () => {
    const people = Array.from({ length: 30 }, (_, index) => `player-${index + 1}`);
    const rng = seededRng();
    const appearances = new Map(people.map((person) => [person, 0]));

    for (let sample = 0; sample < 1000; sample += 1) {
      const [card] = generatePeopleBingoCandidates(people, 1, 5, rng);
      expect(card).toHaveLength(25);
      expect(new Set(card).size).toBe(25);
      for (const person of card) appearances.set(person, (appearances.get(person) ?? 0) + 1);
    }

    const counts = [...appearances.values()];
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(790);
    expect(Math.max(...counts)).toBeLessThanOrEqual(860);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(70);
  });

  it('does not permanently exclude any eligible player when the pool is much larger than the board', () => {
    const people = Array.from({ length: 60 }, (_, index) => `player-${index + 1}`);
    const rng = seededRng(987654321);
    const seen = new Set<string>();

    for (let sample = 0; sample < 200; sample += 1) {
      const [card] = generatePeopleBingoCandidates(people, 1, 5, rng);
      for (const person of card) seen.add(person);
    }

    expect(seen.size).toBe(60);
  });
});
