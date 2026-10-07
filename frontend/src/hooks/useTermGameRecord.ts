import { useCallback } from 'react';
import { createPersistentStore, usePersistentStore } from './persistentStore';

export interface TermGameRecord {
  /** 한 판(10문제) 최고 점수 */
  best_score: number;
  /** 가장 길게 이어간 연속 정답 */
  best_streak: number;
  plays: number;
  /** 최근에 틀린 용어 (맞히면 빠져요) */
  wrong_term_ids: string[];
}

const emptyRecord: TermGameRecord = {
  best_score: 0,
  best_streak: 0,
  plays: 0,
  wrong_term_ids: [],
};

/**
 * 용어 게임 기록. 지금은 localStorage에 저장해요.
 * 로그인 연결 후에는 이 훅 안에서 서버 저장으로 바꾸면 돼요.
 */
const recordStore = createPersistentStore<TermGameRecord>('dajin:term-game', emptyRecord);

export function useTermGameRecord() {
  const record = usePersistentStore(recordStore);

  /** 한 판이 끝나면 점수와 틀린·맞힌 용어를 반영해요. */
  const saveRound = useCallback(
    (result: { score: number; bestStreak: number; correctIds: string[]; wrongIds: string[] }) => {
      recordStore.set((prev) => {
        const wrong = new Set(prev.wrong_term_ids);
        result.correctIds.forEach((id) => wrong.delete(id));
        result.wrongIds.forEach((id) => wrong.add(id));
        return {
          best_score: Math.max(prev.best_score, result.score),
          best_streak: Math.max(prev.best_streak, result.bestStreak),
          plays: prev.plays + 1,
          wrong_term_ids: [...wrong],
        };
      });
    },
    [],
  );

  const reset = useCallback(() => recordStore.set(emptyRecord), []);

  return { record, saveRound, reset };
}
