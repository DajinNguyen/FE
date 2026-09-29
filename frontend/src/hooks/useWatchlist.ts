import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from './persistentStore';

/**
 * 관심 기업 목록. 지금은 localStorage에 저장해요.
 * Google 로그인 연결 후에는 이 훅 안에서 /api/watchlist 호출로 바꾸면 돼요.
 */
const watchlistStore = createPersistentStore<string[]>('dajin:watchlist', []);

export function useWatchlist() {
  const stockCodes = usePersistentStore(watchlistStore);

  const isWatched = useCallback((code: string) => stockCodes.includes(code), [stockCodes]);

  /** 추가하면 true, 빼면 false 를 돌려줘요. */
  const toggle = useCallback((code: string) => {
    const willAdd = !watchlistStore.get().includes(code);
    watchlistStore.set((prev) => (willAdd ? [...prev, code] : prev.filter((c) => c !== code)));
    return willAdd;
  }, []);

  return { stockCodes, isWatched, toggle };
}
