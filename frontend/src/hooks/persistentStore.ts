import { useSyncExternalStore } from 'react';

/**
 * localStorage에 저장하고, 같은 값을 쓰는 모든 컴포넌트가 함께 갱신되는 작은 저장소예요.
 * 나중에 서버 저장으로 바꿀 때는 이 저장소를 쓰는 훅(useWatchlist, useTermProgress) 내부만 바꾸면 돼요.
 */
export interface PersistentStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createPersistentStore<T>(key: string, fallback: T): PersistentStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const get = () => {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  };

  return {
    get,
    set(next) {
      cache = typeof next === 'function' ? (next as (prev: T) => T)(get()) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(cache));
      } catch {
        // 사생활 보호 모드 등에서 저장이 막혀도 화면은 계속 동작해요.
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function usePersistentStore<T>(store: PersistentStore<T>) {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
