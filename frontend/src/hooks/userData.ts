import type { QueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import type { AuthUser } from '../features/auth/AuthContext';
import { createPersistentStore, usePersistentStore, type PersistentStore } from './persistentStore';
import { useAuth } from './useAuth';

/**
 * 계정별 데이터 관리.
 * - 기기 저장 키를 계정별로 나눠요: 로그인 `dajin:{사용자 id}:이름`, 비로그인 `dajin:guest:이름`
 * - 로그인하면 비로그인 기록을 계정으로 합치고 guest 키를 지워요.
 * - 로그아웃하면 resetUserData() 로 계정 쿼리 캐시·서버에 기록이 있는 계정 키·화면 상태를 비워요.
 */
export const GUEST_SCOPE = 'guest';

/** 저장 범위: 로그인하면 사용자 id, 아니면 guest */
export const userScope = (user: AuthUser | null) => (user ? (user.id ?? user.email) : GUEST_SCOPE);

export const scopedKey = (scope: string, name: string) => `dajin:${scope}:${name}`;

interface ScopedStoreConfig<T> {
  name: string;
  fallback: T;
  /** 예전(계정 구분이 없던) 키. 처음 읽을 때 비로그인 기록으로 옮겨요. */
  legacyKey?: string;
  /** 로그인할 때 비로그인 기록을 계정 기록에 합치는 방법. 없으면 여기서 합치지 않아요. */
  mergeGuest?: (account: T, guest: T) => T;
  isEmpty?: (value: T) => boolean;
  /**
   * true: 서버에 기록이 있어서 로그아웃하면 이 기기의 계정 키를 지워요. (다시 로그인하면 서버에서 불러와요)
   * false: 서버 API 가 없는 기기 기록이라 계정 키는 남기고 화면에서만 비워요. (같은 계정으로 로그인하면 돌아와요)
   */
  clearOnLogout: boolean;
}

export interface ScopedStore<T> {
  config: ScopedStoreConfig<T>;
  forScope: (scope: string) => PersistentStore<T>;
}

const scopedStores = new Set<ScopedStore<unknown>>();

function moveLegacy(from: string, to: string) {
  try {
    const raw = window.localStorage.getItem(from);
    if (raw === null) return;
    if (window.localStorage.getItem(to) === null) window.localStorage.setItem(to, raw);
    window.localStorage.removeItem(from);
  } catch {
    // 옮기지 못해도 새로 시작하면 돼요.
  }
}

export function createScopedStore<T>(config: ScopedStoreConfig<T>): ScopedStore<T> {
  const byScope = new Map<string, PersistentStore<T>>();
  const store: ScopedStore<T> = {
    config,
    forScope(scope) {
      const key = scopedKey(scope, config.name);
      if (scope === GUEST_SCOPE && config.legacyKey) moveLegacy(config.legacyKey, key);
      let found = byScope.get(scope);
      if (!found) {
        found = createPersistentStore(key, config.fallback);
        byScope.set(scope, found);
      }
      return found;
    },
  };
  scopedStores.add(store as ScopedStore<unknown>);
  return store;
}

/** 지금 로그인한 계정(또는 guest)의 저장소 값과 저장소 */
export function useScopedStore<T>(store: ScopedStore<T>) {
  const { user } = useAuth();
  const current = store.forScope(userScope(user));
  return [usePersistentStore(current), current] as const;
}

/** 예전 "보내지 못한 기록" 키({ user, data })를 계정별 키로 옮겨요. */
export function moveLegacyPending(legacyKey: string, name: string) {
  try {
    const raw = window.localStorage.getItem(legacyKey);
    if (raw === null) return;
    const old = JSON.parse(raw) as { user?: string; data?: unknown } | null;
    if (old?.user && old.data !== undefined) {
      const key = scopedKey(old.user, name);
      if (window.localStorage.getItem(key) === null) {
        window.localStorage.setItem(key, JSON.stringify(old.data));
      }
    }
    window.localStorage.removeItem(legacyKey);
  } catch {
    // 옮기지 못하면 그 기록만 버려요.
  }
}

/** 로그인하면 비로그인 기록을 계정 기록에 합치고 guest 키를 지워요. */
export function adoptGuestData(scope: string) {
  if (scope === GUEST_SCOPE) return;
  for (const store of scopedStores) {
    const { mergeGuest, isEmpty } = store.config;
    if (!mergeGuest) continue;
    const guest = store.forScope(GUEST_SCOPE);
    const guestValue = guest.get();
    if (isEmpty?.(guestValue)) continue;
    store.forScope(scope).set((account: unknown) => mergeGuest(account, guestValue));
    guest.remove();
  }
}

/** 로그아웃 직전에 할 일 (예: 아직 서버에 못 보낸 기록 보내기). 등록 해제 함수를 돌려줘요. */
type LogoutTask = (scope: string) => Promise<unknown> | void;
const logoutTasks = new Set<LogoutTask>();

export function onBeforeLogout(task: LogoutTask) {
  logoutTasks.add(task);
  return () => {
    logoutTasks.delete(task);
  };
}

/** 로그아웃 직전 할 일을 모두 해요. 오래 걸리면 기다리지 않아요. */
export async function runBeforeLogout(scope: string, timeoutMs = 3000) {
  const tasks = Promise.allSettled([...logoutTasks].map((task) => task(scope)));
  await Promise.race([tasks, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}

/** 메모리에만 있는 계정 상태(예: 챗봇 대화)를 비우는 함수 */
const memoryResetters = new Set<() => void>();

export function onUserDataReset(reset: () => void) {
  memoryResetters.add(reset);
  return () => {
    memoryResetters.delete(reset);
  };
}

/** 로그아웃할 때마다 1씩 늘어요. 화면(페이지)을 이 값으로 다시 그려 컴포넌트 안 상태도 비워요. */
let resetCount = 0;
const resetListeners = new Set<() => void>();

export function useUserDataResetCount() {
  return useSyncExternalStore(
    (listener) => {
      resetListeners.add(listener);
      return () => resetListeners.delete(listener);
    },
    () => resetCount,
  );
}

/**
 * 로그아웃할 때 계정 데이터를 비워요.
 * - TanStack Query 의 계정 쿼리(['me', …])
 * - 서버에 기록이 있는 데이터의 이 계정 기기 키 (clearOnLogout)
 * - 메모리 상태 (챗봇 대화 등), 페이지 안 상태 (화면을 다시 그려요)
 */
export function resetUserData(queryClient: QueryClient, scope: string) {
  queryClient.removeQueries({ queryKey: ['me'] });
  if (scope !== GUEST_SCOPE) {
    for (const store of scopedStores) {
      if (store.config.clearOnLogout) store.forScope(scope).remove();
    }
  }
  memoryResetters.forEach((reset) => reset());
  resetCount += 1;
  resetListeners.forEach((listener) => listener());
}
