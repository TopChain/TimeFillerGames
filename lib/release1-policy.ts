import type { GameId } from './product';

export const RELEASE1_GAME_IDS = ['bingo', 'majority-match', 'quick-draw'] as const satisfies readonly GameId[];
export const RELEASE1_ALLOW_CUSTOM_PHOTOS = false;
export const RELEASE1_KIDS_CONTEXT_ENABLED = false;

export function isRelease1Game(value: string): value is (typeof RELEASE1_GAME_IDS)[number] {
  return (RELEASE1_GAME_IDS as readonly string[]).includes(value);
}

export function assertRelease1RoomPolicy(input: { context?: string | null; allowCustomPhotos?: boolean }) {
  if (input.context === 'Kids' && !RELEASE1_KIDS_CONTEXT_ENABLED) {
    throw new Error('The dedicated Kids context is not available in Release 1.');
  }
  if (input.allowCustomPhotos === true && !RELEASE1_ALLOW_CUSTOM_PHOTOS) {
    throw new Error('Custom participant photos are not available in Release 1. Choose a built-in avatar.');
  }
}
