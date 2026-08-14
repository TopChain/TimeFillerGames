'use client';

import { useEffect, useState } from 'react';

type Appearance = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'timefillergames:appearance';

function applyAppearance(value: Appearance) {
  document.documentElement.dataset.appearance = value;
}

export function AppearanceControl() {
  const [appearance, setAppearance] = useState<Appearance>('system');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next: Appearance = stored === 'light' || stored === 'dark' ? stored : 'system';
    setAppearance(next);
    applyAppearance(next);
  }, []);

  function change(value: Appearance) {
    setAppearance(value);
    applyAppearance(value);
    if (value === 'system') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value);
  }

  return <label className="appearance-control">
    <span className="sr-only">Appearance</span>
    <span aria-hidden="true">◐</span>
    <select aria-label="Appearance" value={appearance} onChange={(event) => change(event.target.value as Appearance)}>
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>;
}
