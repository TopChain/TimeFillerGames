import { describe, expect, it } from 'vitest';
import { GROUP_CONTEXTS } from '../lib/room-flow';
import { RELEASE1_PUBLIC_GUESS_STREAM_ENABLED, validateRelease1GuessVisibility } from '../lib/quick-draw-launch-policy';
import { assertRelease1RoomPolicy, isRelease1Game, RELEASE1_ALLOW_CUSTOM_PHOTOS, RELEASE1_GAME_IDS, RELEASE1_KIDS_CONTEXT_ENABLED } from '../lib/release1-policy';

describe('Release 1 public policy guardrails', () => {
  it('exposes exactly the three Release 1 game engines', () => {
    expect(RELEASE1_GAME_IDS).toEqual(['bingo', 'majority-match', 'quick-draw']);
    expect(isRelease1Game('bingo')).toBe(true);
    expect(isRelease1Game('word-challenge')).toBe(false);
    expect(isRelease1Game('math-challenge')).toBe(false);
  });

  it('keeps child-directed Kids context out of the Release 1 executable context list', () => {
    expect(RELEASE1_KIDS_CONTEXT_ENABLED).toBe(false);
    expect(GROUP_CONTEXTS).not.toContain('Kids');
    expect(() => assertRelease1RoomPolicy({ context: 'Kids' })).toThrow(/not available/i);
  });

  it('keeps custom participant photos disabled', () => {
    expect(RELEASE1_ALLOW_CUSTOM_PHOTOS).toBe(false);
    expect(() => assertRelease1RoomPolicy({ allowCustomPhotos: true })).toThrow(/not available/i);
    expect(() => assertRelease1RoomPolicy({ allowCustomPhotos: false })).not.toThrow();
  });

  it('keeps public Quick Draw guess streaming disabled', () => {
    expect(RELEASE1_PUBLIC_GUESS_STREAM_ENABLED).toBe(false);
    expect(validateRelease1GuessVisibility('hidden-until-correct')).toBe('hidden-until-correct');
    expect(() => validateRelease1GuessVisibility('moderated-stream')).toThrow(/disabled/i);
  });
});
