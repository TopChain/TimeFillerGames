'use client';

import { useEffect, useState } from 'react';
import { LOCALES, type Locale } from './product';

const KEY = 'timefillergames:host-ui-locale';

function validLocale(value: string | null): Locale {
  return value && LOCALES.some((locale) => locale.id === value) ? value as Locale : 'en';
}

function storedLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  return validLocale(window.localStorage.getItem(KEY));
}

export function useHostUiLocale() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const sync = () => setLocale(storedLocale());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    const observer = new MutationObserver(() => {
      const documentLocale = validLocale(document.documentElement.lang);
      const saved = storedLocale();
      setLocale(documentLocale === 'en' && saved !== 'en' ? saved : documentLocale);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  return locale;
}
