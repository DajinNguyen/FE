import { useCallback } from 'react';
import type { CompanySummary } from '../types';
import { createScopedStore, useScopedStore } from './userData';

export interface RecentSearch {
  stock_code: string;
  name: string;
}

const MAX_RECENT = 8;

/**
 * 최근에 검색해서 열어 본 기업. 기기(localStorage)에 계정별로 저장해요.
 * 로그아웃하면 화면에서 비우고, 같은 계정으로 다시 로그인하면 돌아와요.
 */
const recentStores = createScopedStore<RecentSearch[]>({
  name: 'recent-searches',
  fallback: [],
  legacyKey: 'dajin:recent-searches',
  mergeGuest: (account, guest) =>
    [...account, ...guest.filter((g) => !account.some((a) => a.stock_code === g.stock_code))].slice(
      0,
      MAX_RECENT,
    ),
  isEmpty: (items) => items.length === 0,
  clearOnLogout: false,
});

export function useRecentSearches() {
  const [items, recentStore] = useScopedStore(recentStores);

  const add = useCallback(
    (company: Pick<CompanySummary, 'stock_code' | 'name'>) => {
      recentStore.set((prev) =>
        [
          { stock_code: company.stock_code, name: company.name },
          ...prev.filter((item) => item.stock_code !== company.stock_code),
        ].slice(0, MAX_RECENT),
      );
    },
    [recentStore],
  );

  const remove = useCallback(
    (stockCode: string) =>
      recentStore.set((prev) => prev.filter((item) => item.stock_code !== stockCode)),
    [recentStore],
  );

  const clear = useCallback(() => recentStore.set([]), [recentStore]);

  return { items, add, remove, clear };
}
