import { describe, expect, it } from 'vitest';
import { AVATARS, disambiguateNickname, evaluateReadiness, generateNickname, nicknameIssue, normalizeRoomCode } from '../lib/room-flow';

describe('room joining', () => {
  it('normalizes harmless formatting differences', () => {
    expect(normalizeRoomCode(' tf-g 48_21 ')).toBe('TFG4821');
    expect(normalizeRoomCode('ＴＦＧ４８２１')).toBe('TFG4821');
  });
});

describe('avatar identity', () => {
  it('contains exactly 60 built-in avatars across five collections', () => {
    expect(AVATARS).toHaveLength(60);
    expect(new Set(AVATARS.map((avatar) => avatar.category)).size).toBe(5);
  });

  it('preserves the plan examples for generated names', () => {
    expect(generateNickname(AVATARS.find((avatar) => avatar.label === 'Tiger')!)).toBe('Brave Tiger');
    expect(generateNickname(AVATARS.find((avatar) => avatar.label === 'Mango')!)).toBe('Lucky Mango');
    expect(generateNickname(AVATARS.find((avatar) => avatar.label === 'Aries')!)).toBe('Cosmic Aries');
  });

  it('disambiguates duplicate room names', () => {
    expect(disambiguateNickname('Brave Tiger', ['Brave Tiger', 'Brave Tiger 2'])).toBe('Brave Tiger 3');
  });

  it('disambiguates duplicate names case-insensitively for Host overrides', () => {
    expect(disambiguateNickname('Happy Panda', ['happy panda', 'HAPPY PANDA 2'])).toBe('Happy Panda 3');
  });
});

describe('host lobby readiness', () => {
  it('blocks Quick Draw below its hard minimum', () => {
    expect(evaluateReadiness({ gameId: 'quick-draw', activePlayers: 2 })).toEqual({
      state: 'below-minimum', canStart: false, message: '1 more player required.',
    });
  });

  it('enforces a host participant cap separately from game-rule maximum', () => {
    expect(evaluateReadiness({ gameId: 'majority-match', activePlayers: 8, hostCap: 6 }).state).toBe('above-limit');
  });

  it('allows a reconnect grace state when the game otherwise meets minimum', () => {
    const result = evaluateReadiness({ gameId: 'bingo', activePlayers: 4, reconnectingPlayers: 1 });
    expect(result.canStart).toBe(true);
    expect(result.state).toBe('reconnecting');
  });
});

describe('classroom-safe nickname structure', () => {
  it('blocks links and contact information without pretending to be a full profanity service', () => {
    expect(nicknameIssue('www.example.com', true)).not.toBeNull();
    expect(nicknameIssue('me@example.com', true)).not.toBeNull();
    expect(nicknameIssue('+1 (909) 555-1234', true)).not.toBeNull();
    expect(nicknameIssue('Happy Panda', true)).toBeNull();
  });

  it('still enforces the nickname length boundary for Host overrides', () => {
    expect(nicknameIssue('A', true)).not.toBeNull();
    expect(nicknameIssue('A'.repeat(25), true)).not.toBeNull();
    expect(nicknameIssue('Cosmic Aries', true)).toBeNull();
  });
});
