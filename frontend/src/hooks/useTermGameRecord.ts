import { useCallback } from 'react';
import { createScopedStore, useScopedStore } from './userData';

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
 * 용어 게임 기록. 서버 API 가 없어서 기기(localStorage)에 계정별로 저장해요.
 * 로그아웃하면 화면에서 비우고, 같은 계정으로 다시 로그인하면 돌아와요.
 */
const recordStores = createScopedStore<TermGameRecord>({
  name: 'term-game',
  fallback: emptyRecord,
  legacyKey: 'dajin:term-game',
  mergeGuest: (account, guest) => ({
    best_score: Math.max(account.best_score, guest.best_score),
    best_streak: Math.max(account.best_streak, guest.best_streak),
    plays: account.plays + guest.plays,
    wrong_term_ids: [...new Set([...account.wrong_term_ids, ...guest.wrong_term_ids])],
  }),
  isEmpty: (record) => record.plays === 0,
  clearOnLogout: false,
});

export function useTermGameRecord() {
  const [record, recordStore] = useScopedStore(recordStores);

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
    [recordStore],
  );

  const reset = useCallback(() => recordStore.set(emptyRecord), [recordStore]);

  return { record, saveRound, reset };
}
