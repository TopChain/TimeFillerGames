'use client';

import { useEffect, useState } from 'react';
import type { Locale } from './product';
import { fetchRoomSnapshot } from './client-room';

export function usePlayerUiLocale(accessToken: string, roomCode: string, fallback: Locale = 'en') {
  const [locale, setLocale] = useState<Locale>(fallback);

  useEffect(() => {
    let cancelled = false;
    void fetchRoomSnapshot(accessToken, roomCode)
      .then((snapshot) => {
        if (cancelled) return;
        const own = snapshot.participants[0];
        if (own?.ui_language) setLocale(own.ui_language);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [accessToken, roomCode]);

  return locale;
}
