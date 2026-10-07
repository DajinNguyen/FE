import { useCallback } from 'react';
import type { CompanySummary } from '../types';
import { createPersistentStore, usePersistentStore } from './persistentStore';

export interface RecentSearch {
  stock_code: string;
  name: string;
}

const MAX_RECENT = 8;

/**
 * 최근에 검색해서 열어 본 기업. 지금은 localStorage에 저장해요.
 * 로그인 연결 후에는 이 훅 안에서 서버 저장으로 바꾸면 돼요.
 */
const recentStore = createPersistentStore<RecentSearch[]>('dajin:recent-searches', []);

export function useRecentSearches() {
  const items = usePersistentStore(recentStore);

  const add = useCallback((company: Pick<CompanySummary, 'stock_code' | 'name'>) => {
    recentStore.set((prev) =>
      [
        { stock_code: company.stock_code, name: company.name },
        ...prev.filter((item) => item.stock_code !== company.stock_code),
      ].slice(0, MAX_RECENT),
    );
  }, []);

  const remove = useCallback((stockCode: string) => {
    recentStore.set((prev) => prev.filter((item) => item.stock_code !== stockCode));
  }, []);

  const clear = useCallback(() => recentStore.set([]), []);

  return { items, add, remove, clear };
}
