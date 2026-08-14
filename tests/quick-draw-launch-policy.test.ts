import { describe, expect, it } from 'vitest';
import { RELEASE1_PUBLIC_GUESS_STREAM_ENABLED, validateRelease1GuessVisibility } from '../lib/quick-draw-launch-policy';

describe('Release 1 Quick Draw launch policy', () => {
  it('keeps the public guess stream disabled at launch', () => {
    expect(RELEASE1_PUBLIC_GUESS_STREAM_ENABLED).toBe(false);
  });

  it('allows private hidden guesses', () => {
    expect(validateRelease1GuessVisibility('hidden-until-correct')).toBe('hidden-until-correct');
  });

  it('rejects the public moderated stream until a later approved release', () => {
    expect(() => validateRelease1GuessVisibility('moderated-stream')).toThrow(/disabled for the Release 1 launch/i);
  });
});
