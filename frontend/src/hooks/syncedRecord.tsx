import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { createPersistentStore, usePersistentStore } from './persistentStore';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export const SYNC_TIMING = {
  /** 바뀔 때마다 바로 보내지 않고 잠깐 모았다가 한 번에 보내요 (ms) */
  debounce: 500,
  /** 저장에 실패하면 이만큼 기다렸다가 다시 시도해요 (ms). 마지막 값을 계속 써요. */
  retryDelays: [3_000, 10_000, 30_000, 60_000],
};

export const SAVE_FAILED_TOAST = '기록 저장에 실패했어요, 다시 시도할게요';

interface SyncedRecordConfig<T> {
  /** localStorage 키·쿼리 키에 쓰는 이름 */
  name: string;
  empty: T;
  /** 로그인 사용자의 서버 기록 불러오기 */
  load: () => Promise<T>;
  /** 서버에 저장하고, 서버가 정리한 기록을 돌려줘요. */
  save: (data: T) => Promise<T>;
  /** 두 기록 합치기 (처음 로그인할 때 기기 기록 + 서버 기록) */
  merge: (server: T, local: T) => T;
  isEmpty: (data: T) => boolean;
}

interface SyncedRecordValue<T> {
  data: T;
  update: (fn: (prev: T) => T) => void;
  /** 로그인했으면 서버, 아니면 기기에 저장해요. */
  storage: 'server' | 'device';
}

/**
 * 로그인 여부에 따라 저장 위치가 바뀌는 기록 (학습 기록, 낱말퀴즈 보상).
 * - 비로그인: 기기(localStorage)
 * - 로그인: 서버. 다른 기기에서도 이어서 볼 수 있어요.
 * - 처음 로그인하면 기기 기록을 서버 기록과 합쳐 올리고, 기기 기록은 지워요.
 * - 저장에 실패하면 기기에 임시로 두고(pending) 다시 시도해요. 새로고침해도 남아 있어요.
 */
export function createSyncedRecord<T>(config: SyncedRecordConfig<T>) {
  const guestStore = createPersistentStore<T>(`dajin:${config.name}`, config.empty);
  const pendingStore = createPersistentStore<{ user: string; data: T } | null>(
    `dajin:${config.name}:pending`,
    null,
  );
  const Context = createContext<SyncedRecordValue<T> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const { user, isLoggedIn } = useAuth();
    const userKey = user ? (user.id ?? user.email) : '';
    const guest = usePersistentStore(guestStore);
    const pendingAll = usePersistentStore(pendingStore);
    const pending = pendingAll && pendingAll.user === userKey ? pendingAll.data : null;
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const queryKey = useMemo(() => ['me', config.name, userKey], [userKey]);

    const query = useQuery({
      queryKey,
      queryFn: config.load,
      enabled: isLoggedIn,
      staleTime: Infinity,
    });

    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const failures = useRef(0);

    // 한 번에 하나만 보내요. 보내는 동안 바뀐 기록은 끝난 뒤 이어서 보내요.
    const saving = useRef(false);
    const saveNow = useCallback(async () => {
      const item = pendingStore.get();
      if (!item || item.user !== userKey || saving.current) return;
      saving.current = true;
      try {
        const saved = await config.save(item.data);
        queryClient.setQueryData(queryKey, saved);
        failures.current = 0;
        // 보내는 사이에 또 바뀌었으면 서버 기록 위에 다시 얹어서 이어서 보내요.
        const newer = pendingStore.get();
        if (newer === item) {
          pendingStore.set(null);
        } else if (newer && newer.user === userKey) {
          pendingStore.set({ user: userKey, data: config.merge(saved, newer.data) });
          clearTimeout(timer.current);
          timer.current = setTimeout(saveNow, SYNC_TIMING.debounce);
        }
      } catch {
        failures.current += 1;
        if (failures.current === 1) showToast(SAVE_FAILED_TOAST);
        const { retryDelays } = SYNC_TIMING;
        const delay = retryDelays[Math.min(failures.current, retryDelays.length) - 1];
        clearTimeout(timer.current);
        timer.current = setTimeout(saveNow, delay);
      } finally {
        saving.current = false;
      }
    }, [userKey, queryKey, queryClient, showToast]);

    /** 로그인 상태에서 바뀐 기록: 기기에 먼저 남기고 잠시 뒤 서버에 보내요. */
    const commit = useCallback(
      (data: T) => {
        pendingStore.set({ user: userKey, data });
        // 실패해서 다시 시도를 기다리는 중이면 그때 이 기록까지 함께 보내요.
        if (failures.current > 0) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(saveNow, SYNC_TIMING.debounce);
      },
      [userKey, saveNow],
    );

    // 로그인 후 서버 기록을 받으면 한 번: 못 보낸 기록·기기 기록을 합쳐서 올려요.
    const syncedFor = useRef<string | null>(null);
    const serverData = query.data;
    useEffect(() => {
      if (!isLoggedIn || serverData === undefined || syncedFor.current === userKey) return;
      syncedFor.current = userKey;
      let next: T = serverData;
      let changed = false;
      const unsent = pendingStore.get();
      if (unsent && unsent.user === userKey) {
        next = config.merge(next, unsent.data);
        changed = true;
      }
      const local = guestStore.get();
      if (!config.isEmpty(local)) {
        next = config.merge(next, local);
        guestStore.set(config.empty);
        changed = true;
      }
      if (changed) commit(next);
    }, [isLoggedIn, serverData, userKey, commit]);

    useEffect(() => {
      if (!isLoggedIn) syncedFor.current = null;
    }, [isLoggedIn]);

    useEffect(() => () => clearTimeout(timer.current), []);

    // 로그인했는데 서버 기록을 아직 못 받았으면 기기 기록을 그대로 보여줘요.
    const current = isLoggedIn ? (pending ?? serverData ?? guest) : guest;
    const update = useCallback(
      (fn: (prev: T) => T) => {
        if (!isLoggedIn) {
          guestStore.set(fn);
          return;
        }
        const base = pendingStore.get();
        const prev =
          base && base.user === userKey
            ? base.data
            : (queryClient.getQueryData<T>(queryKey) ?? guestStore.get());
        commit(fn(prev));
      },
      [isLoggedIn, userKey, queryClient, queryKey, commit],
    );

    const value = useMemo<SyncedRecordValue<T>>(
      () => ({ data: current, update, storage: isLoggedIn ? 'server' : 'device' }),
      [current, update, isLoggedIn],
    );
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useRecord() {
    const context = useContext(Context);
    if (!context) throw new Error(`${config.name} 기록은 Provider 안에서 사용해요.`);
    return context;
  }

  return { Provider, useRecord, guestStore };
}
