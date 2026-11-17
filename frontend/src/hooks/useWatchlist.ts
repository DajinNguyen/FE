import { useCallback } from 'react';
import { getWatchlist, putWatchlist } from '../api/me';
import type { Watchlist } from '../types';
import { createSyncedRecord } from './syncedRecord';

/** 서버가 저장하는 최대 개수 (넘으면 422) */
export const WATCHLIST_LIMIT = 200;
export const WATCHLIST_FULL_TOAST = `관심 기업은 ${WATCHLIST_LIMIT}개까지 담을 수 있어요`;

const emptyWatchlist: Watchlist = { stock_codes: [] };

const cap = (codes: string[]): Watchlist => ({ stock_codes: codes.slice(0, WATCHLIST_LIMIT) });

/** 서버 목록 순서를 지키고, 기기에만 있던 회사를 뒤에 붙여요. */
export function mergeWatchlist(server: Watchlist, local: Watchlist): Watchlist {
  const codes = [...server.stock_codes];
  for (const code of local.stock_codes) if (!codes.includes(code)) codes.push(code);
  return cap(codes);
}

const watchlistRecord = createSyncedRecord<Watchlist>({
  name: 'watchlist',
  empty: emptyWatchlist,
  load: getWatchlist,
  save: putWatchlist,
  merge: mergeWatchlist,
  // 아직 못 보낸 목록은 사용자가 마지막으로 만든 목록이라 그대로 써요. (합치면 뺀 회사가 되살아나요)
  rebase: (_, unsent) => unsent,
  isEmpty: (w) => w.stock_codes.length === 0,
  adoptAccountKey: true,
});

/**
 * 예전 기기 기록을 새 형식({ stock_codes })으로 옮겨요. 앱을 불러올 때 한 번 해요.
 * - `dajin:watchlist` (계정 구분 없던 문자열 배열) → 비로그인 기록 `dajin:guest:watchlist`
 * - `dajin:{guest|사용자 id}:watchlist` 의 문자열 배열 → { stock_codes } (계정 키는 로그인할 때 서버로 올려요)
 */
export function migrateWatchlistKeys() {
  try {
    const storage = window.localStorage;
    const legacy = storage.getItem('dajin:watchlist');
    if (legacy !== null) {
      if (storage.getItem('dajin:guest:watchlist') === null) {
        storage.setItem('dajin:guest:watchlist', legacy);
      }
      storage.removeItem('dajin:watchlist');
    }
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || !/^dajin:[^:]+:watchlist$/.test(key)) continue;
      const value = JSON.parse(storage.getItem(key) ?? 'null') as unknown;
      if (Array.isArray(value)) storage.setItem(key, JSON.stringify(cap(value.map(String))));
    }
  } catch {
    // 옮기지 못해도 새로 시작하면 돼요.
  }
}
migrateWatchlistKeys();

/** 관심 기업 Provider (AppProviders 에 있어요) */
export const WatchlistProvider = watchlistRecord.Provider;

export type WatchlistToggleResult = 'added' | 'removed' | 'full';

/**
 * 관심 기업 목록. 로그인하면 서버(GET·PUT /api/me/watchlist)에 저장해서 다른 기기에서도 보여요.
 * 비로그인은 이 기기(localStorage)에만 두고, 로그인하면 계정 목록에 합쳐요.
 * 로그아웃하면 화면에서 비우고, 다시 로그인하면 서버에서 불러와요.
 */
export function useWatchlist() {
  const { data, update, storage } = watchlistRecord.useRecord();
  const stockCodes = data.stock_codes;

  const isWatched = useCallback((code: string) => stockCodes.includes(code), [stockCodes]);

  const toggle = useCallback(
    (code: string): WatchlistToggleResult => {
      if (stockCodes.includes(code)) {
        update((prev) => ({ stock_codes: prev.stock_codes.filter((c) => c !== code) }));
        return 'removed';
      }
      if (stockCodes.length >= WATCHLIST_LIMIT) return 'full';
      update((prev) => (prev.stock_codes.includes(code) ? prev : cap([...prev.stock_codes, code])));
      return 'added';
    },
    [stockCodes, update],
  );

  return { stockCodes, isWatched, toggle, storage };
}
