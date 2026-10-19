import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from './persistentStore';

/**
 * 퍼즐 진행 상황과 기록. 지금은 기기(localStorage)에 저장해요.
 * 로그인 후 서버 저장으로 바꿀 때는 이 훅 안만 바꾸면 돼요.
 */
export interface CrosswordSave {
  /** 칸("행,열")별 입력 글자 */
  entries: Record<string, string>;
  hint_levels: Record<number, number>;
  hints_used: number;
  /** 지금 판에서 흐른 시간 */
  elapsed_ms: number;
  /** 지금 판에서 [정답 보기]를 썼는지 */
  revealed: boolean;
  /** 지금 판을 다 풀었는지 (정답 보기 포함) */
  completed: boolean;
  /** 정답 보기 없이 푼 최고 기록 */
  best_ms: number | null;
  /** 한 번이라도 끝까지 풀었는지 (목록의 "완료" 표시) */
  ever_completed: boolean;
}

export const emptySave: CrosswordSave = {
  entries: {},
  hint_levels: {},
  hints_used: 0,
  elapsed_ms: 0,
  revealed: false,
  completed: false,
  best_ms: null,
  ever_completed: false,
};

const crosswordStore = createPersistentStore<Record<string, CrosswordSave>>('dajin:crossword', {});

export function useCrosswordSaves() {
  return usePersistentStore(crosswordStore);
}

export function useCrosswordSave(puzzleId: string) {
  const saves = usePersistentStore(crosswordStore);
  const saved = saves[puzzleId] ?? emptySave;

  const save = useCallback(
    (patch: Partial<CrosswordSave>) => {
      crosswordStore.set((all) => ({
        ...all,
        [puzzleId]: { ...(all[puzzleId] ?? emptySave), ...patch },
      }));
    },
    [puzzleId],
  );

  /** 다 풀었을 때: 정답 보기 없이 풀었으면 최고 기록을 갱신하고, 최고 기록이면 true */
  const complete = useCallback(
    (elapsedMs: number, revealed: boolean) => {
      const prev = crosswordStore.get()[puzzleId] ?? emptySave;
      const isBest = !revealed && (prev.best_ms === null || elapsedMs < prev.best_ms);
      save({
        completed: true,
        elapsed_ms: elapsedMs,
        revealed,
        ever_completed: true,
        best_ms: isBest ? elapsedMs : prev.best_ms,
      });
      return isBest;
    },
    [puzzleId, save],
  );

  /** 다시 하기: 기록(최고 기록·완료 여부)은 남기고 판만 비워요. */
  const restart = useCallback(() => {
    const prev = crosswordStore.get()[puzzleId] ?? emptySave;
    save({ ...emptySave, best_ms: prev.best_ms, ever_completed: prev.ever_completed });
  }, [puzzleId, save]);

  return { saved, save, complete, restart };
}
