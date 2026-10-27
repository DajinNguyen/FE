import { useCallback } from 'react';
import { PUZZLE_REWARD } from '../config/usagePolicy';
import { createPersistentStore, usePersistentStore } from './persistentStore';
import { useAuth } from './useAuth';

/**
 * 낱말퀴즈 보상으로 받은 리포트 추가 횟수. 지금은 기기(localStorage)에 기록해요.
 * 서버가 횟수를 관리하게 되면 이 훅 안만 서버 값으로 바꾸면 돼요.
 */
interface RewardRecord {
  /** 기록한 날짜 (YYYY-MM-DD). 날짜가 바뀌면 0부터 다시 세요. */
  date: string;
  /** 오늘 보상을 받은 퍼즐 id */
  puzzles: string[];
}

const rewardStore = createPersistentStore<RewardRecord>('dajin:puzzle-rewards', {
  date: '',
  puzzles: [],
});

const todayString = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export type PuzzleRewardResult = 'granted' | 'revealed' | 'guest' | 'daily-max' | 'already';

export function useUsageCredits() {
  const record = usePersistentStore(rewardStore);
  const { isLoggedIn } = useAuth();
  const today = todayString();
  const rewarded = record.date === today ? record.puzzles : [];
  const bonus = isLoggedIn ? rewarded.length * PUZZLE_REWARD.perPuzzle : 0;
  const canEarnMore = isLoggedIn && rewarded.length < PUZZLE_REWARD.dailyMax;

  /** 낱말퀴즈를 다 풀었을 때 불러요. 정답 보기를 썼으면 보상이 없어요. */
  const onPuzzleComplete = useCallback(
    (puzzleId: string, { revealed }: { revealed: boolean }): PuzzleRewardResult => {
      if (revealed) return 'revealed';
      if (PUZZLE_REWARD.membersOnly && !isLoggedIn) return 'guest';
      const current = rewardStore.get();
      const list = current.date === todayString() ? current.puzzles : [];
      if (list.includes(puzzleId)) return 'already';
      if (list.length >= PUZZLE_REWARD.dailyMax) return 'daily-max';
      rewardStore.set({ date: todayString(), puzzles: [...list, puzzleId] });
      return 'granted';
    },
    [isLoggedIn],
  );

  return { bonus, canEarnMore, onPuzzleComplete };
}
