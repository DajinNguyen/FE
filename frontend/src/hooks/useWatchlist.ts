import { useCallback } from 'react';
import { createScopedStore, useScopedStore } from './userData';

/**
 * 관심 기업 목록. 서버 API 가 생기기 전까지 기기(localStorage)에 계정별로 저장해요.
 * 로그아웃하면 화면에서 비우고, 같은 계정으로 다시 로그인하면 돌아와요.
 * 서버 API(GET·PUT /api/me/watchlist)가 생기면 이 훅 안에서 바꾸면 돼요.
 */
const watchlistStores = createScopedStore<string[]>({
  name: 'watchlist',
  fallback: [],
  legacyKey: 'dajin:watchlist',
  mergeGuest: (account, guest) => [...account, ...guest.filter((c) => !account.includes(c))],
  isEmpty: (codes) => codes.length === 0,
  clearOnLogout: false,
});

export function useWatchlist() {
  const [stockCodes, watchlistStore] = useScopedStore(watchlistStores);

  const isWatched = useCallback((code: string) => stockCodes.includes(code), [stockCodes]);

  /** 추가하면 true, 빼면 false 를 돌려줘요. */
  const toggle = useCallback(
    (code: string) => {
      const willAdd = !watchlistStore.get().includes(code);
      watchlistStore.set((prev) => (willAdd ? [...prev, code] : prev.filter((c) => c !== code)));
      return willAdd;
    },
    [watchlistStore],
  );

  return { stockCodes, isWatched, toggle };
}
