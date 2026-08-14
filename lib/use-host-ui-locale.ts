'use client';

import { useEffect, useState } from 'react';
import { LOCALES, type Locale } from './product';

const KEY = 'timefillergames:host-ui-locale';

function storedLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const value = window.localStorage.getItem(KEY) as Locale | null;
  return value && LOCALES.some((locale) => locale.id === value) ? value : 'en';
}

export function useHostUiLocale() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    setLocale(storedLocale());
    const sync = () => setLocale(storedLocale());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  return locale;
}
