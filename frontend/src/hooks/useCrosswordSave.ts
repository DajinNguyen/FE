import { useCallback } from 'react';
import { createScopedStore, useScopedStore } from './userData';

/**
 * 풀던 퍼즐 판. 나갔다 와도 이어서 풀 수 있게 지금 판만 기기(localStorage)에 계정별로 저장해요.
 * (최고 기록 같은 지난 기록은 쌓지 않아요.) 로그아웃하면 화면에서 비우고, 같은 계정으로 로그인하면 돌아와요.
 * 서버 저장으로 바꿀 때는 이 훅 안만 바꾸면 돼요.
 */
export interface CrosswordSave {
  /** 칸("행,열")별 입력 글자 */
  entries: Record<string, string>;
  hint_levels: Record<number, number>;
  hints_used: number;
  /** 지금 판에서 흐른 시간 */
  elapsed_ms: number;
  /** [정답 보기]를 썼는지, 그때 정답으로 채운 칸 */
  revealed: boolean;
  revealed_keys: string[];
}

export const emptySave: CrosswordSave = {
  entries: {},
  hint_levels: {},
  hints_used: 0,
  elapsed_ms: 0,
  revealed: false,
  revealed_keys: [],
};

const crosswordStores = createScopedStore<Record<string, CrosswordSave>>({
  name: 'crossword',
  fallback: {},
  legacyKey: 'dajin:crossword',
  // 같은 퍼즐을 둘 다 풀던 중이면 계정 쪽 판을 남겨요.
  mergeGuest: (account, guest) => ({ ...guest, ...account }),
  isEmpty: (saves) => Object.keys(saves).length === 0,
  clearOnLogout: false,
});

export function useCrosswordSave(puzzleId: string) {
  const [saves, crosswordStore] = useScopedStore(crosswordStores);
  const saved = { ...emptySave, ...saves[puzzleId] };

  const save = useCallback(
    (patch: Partial<CrosswordSave>) => {
      crosswordStore.set((all) => ({
        ...all,
        [puzzleId]: { ...emptySave, ...all[puzzleId], ...patch },
      }));
    },
    [puzzleId, crosswordStore],
  );

  /** 다시 하기: 판을 비워요. */
  const restart = useCallback(() => save(emptySave), [save]);

  return { saved, save, restart };
}
