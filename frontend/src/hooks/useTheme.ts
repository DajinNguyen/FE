import { useEffect } from 'react';
import { createPersistentStore, usePersistentStore } from './persistentStore';

export type ThemeMode = 'system' | 'light' | 'dark';

const themeStore = createPersistentStore<ThemeMode>('dajin:theme', 'system');
const order: ThemeMode[] = ['system', 'light', 'dark'];

export function useTheme() {
  const mode = usePersistentStore(themeStore);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    if (mode === 'system') delete root.dataset.theme;
    else root.dataset.theme = mode;
    // 바뀐 색이 한 번 그려진 다음에 전환 효과를 다시 켜요.
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove('theme-switching')),
    );
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  const cycle = () => themeStore.set(order[(order.indexOf(mode) + 1) % order.length]);

  return { mode, cycle };
}
