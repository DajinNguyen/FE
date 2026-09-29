import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from './persistentStore';

export type TermMark = 'known' | 'review';

/**
 * 용어 카드 진행 상황. 지금은 localStorage에 저장해요.
 * 로그인 연결 후에는 이 훅 안에서 서버 저장으로 바꾸면 돼요.
 */
const progressStore = createPersistentStore<Record<string, TermMark>>('dajin:term-progress', {});

export function useTermProgress() {
  const marks = usePersistentStore(progressStore);

  const mark = useCallback((termId: string, value: TermMark) => {
    progressStore.set((prev) => ({ ...prev, [termId]: value }));
  }, []);

  const reset = useCallback(() => progressStore.set({}), []);

  const knownCount = Object.values(marks).filter((m) => m === 'known').length;

  return { marks, mark, reset, knownCount };
}
