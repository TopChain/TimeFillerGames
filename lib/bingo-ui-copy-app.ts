import { BINGO_UI_COPY as BASE_BINGO_UI_COPY, type BingoUiCopy as BaseBingoUiCopy } from './bingo-ui-copy';
import { GAME_UI_COPY } from './game-ui-copy';
import { LOCALES, type Locale } from './product';

export type BingoUiCopy = BaseBingoUiCopy & { remaining: string };

export const BINGO_UI_COPY = Object.fromEntries(
  LOCALES.map(({ id }) => [
    id,
    { ...BASE_BINGO_UI_COPY[id], remaining: GAME_UI_COPY[id].common.remaining },
  ]),
) as Record<Locale, BingoUiCopy>;
