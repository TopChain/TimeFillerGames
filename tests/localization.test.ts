import { describe, expect, it } from 'vitest';
import { BINGO_RESULT_UI_COPY } from '../lib/bingo-result-ui-copy';
import { BINGO_UI_COPY } from '../lib/bingo-ui-copy';
import { GAME_UI_COPY } from '../lib/game-ui-copy';
import { MAJORITY_UI_COPY } from '../lib/majority-ui-copy';
import { LOCALES, type Locale } from '../lib/product';
import { RANKING_RESULT_UI_COPY } from '../lib/ranking-result-ui-copy';

const localeIds = LOCALES.map((locale) => locale.id) as Locale[];

function expectNoBlankStrings(value: unknown) {
  if (typeof value === 'string') {
    expect(value.trim().length).toBeGreaterThan(0);
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(expectNoBlankStrings);
  }
}

describe('Release 1 Player interface localization', () => {
  it('keeps the approved six locale identifiers', () => {
    expect(localeIds).toEqual(['en', 'zh-Hant', 'zh-Hans', 'es', 'ja', 'ko']);
  });

  it.each(localeIds)('has non-empty Quick Draw interface copy for %s', (locale) => {
    expectNoBlankStrings(GAME_UI_COPY[locale]);
  });

  it.each(localeIds)('has non-empty Bingo interface and result copy for %s', (locale) => {
    expectNoBlankStrings(BINGO_UI_COPY[locale]);
    expectNoBlankStrings(BINGO_RESULT_UI_COPY[locale]);
  });

  it.each(localeIds)('has non-empty Majority Match interface copy for %s', (locale) => {
    expectNoBlankStrings(MAJORITY_UI_COPY[locale]);
  });

  it.each(localeIds)('has non-empty ranking-result interface copy for %s', (locale) => {
    expectNoBlankStrings(RANKING_RESULT_UI_COPY[locale]);
  });
});
