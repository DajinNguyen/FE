import { useEffect } from 'react';
import { createPersistentStore, usePersistentStore } from './persistentStore';

export type ThemeMode = 'system' | 'light' | 'dark';

const themeStore = createPersistentStore<ThemeMode>('dajin:theme', 'system');
const order: ThemeMode[] = ['system', 'light', 'dark'];

export function useTheme() {
  const mode = usePersistentStore(themeStore);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') delete root.dataset.theme;
    else root.dataset.theme = mode;
  }, [mode]);

  const cycle = () => themeStore.set(order[(order.indexOf(mode) + 1) % order.length]);

  return { mode, cycle };
}
