import { useCallback } from 'react';
import { PUZZLE_REWARD } from '../config/usagePolicy';
import { createPersistentStore, usePersistentStore } from './persistentStore';
import { useAuth } from './useAuth';

/**
 * 낱말퀴즈 보상: 정답 보기 없이 퍼즐 3개를 풀 때마다 리포트 만들기 1회 추가 (하루 최대 2회).
 * 지금은 기기(localStorage)에 기록해요. 서버가 관리하게 되면 이 훅 안만 서버 값으로 바꾸면 돼요.
 */
interface RewardRecord {
  /** 기록한 날짜 (YYYY-MM-DD). 날짜가 바뀌면 0부터 다시 세요. */
  date: string;
  /** 오늘 정답 보기 없이 다 푼 퍼즐 id (같은 퍼즐은 한 번만) */
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

const { puzzlesPerReward, dailyMax } = PUZZLE_REWARD;
/** 보상을 다 받는 데 필요한 퍼즐 수 (이보다 많이 풀어도 더 세지 않아요) */
const maxCounted = puzzlesPerReward * dailyMax;

/**
 * granted  : 이번 퍼즐로 3개를 채워 1회 추가
 * progress : 셌지만 아직 3개가 안 됐어요
 * revealed : 정답 보기를 써서 세지 않아요
 * guest    : 로그인하지 않아서 세지 않아요
 * daily-max: 오늘 보상을 다 받았어요
 * already  : 오늘 이미 센 퍼즐이에요
 */
export type PuzzleRewardResult =
  'granted' | 'progress' | 'revealed' | 'guest' | 'daily-max' | 'already';

export function useUsageCredits() {
  const record = usePersistentStore(rewardStore);
  const { isLoggedIn } = useAuth();
  const solved = isLoggedIn && record.date === todayString() ? record.puzzles.length : 0;
  const bonus = Math.min(Math.floor(solved / puzzlesPerReward), dailyMax);
  const canEarnMore = isLoggedIn && bonus < dailyMax;
  /** 다음 보상까지 푼 개수 (0~2). 보상을 다 받았으면 3 */
  const progress = canEarnMore ? solved % puzzlesPerReward : puzzlesPerReward;

  /** 낱말퀴즈를 다 풀었을 때 불러요. */
  const onPuzzleComplete = useCallback(
    (puzzleId: string, { revealed }: { revealed: boolean }): PuzzleRewardResult => {
      if (revealed) return 'revealed';
      if (PUZZLE_REWARD.membersOnly && !isLoggedIn) return 'guest';
      const current = rewardStore.get();
      const list = current.date === todayString() ? current.puzzles : [];
      if (list.includes(puzzleId)) return 'already';
      if (list.length >= maxCounted) return 'daily-max';
      const next = [...list, puzzleId];
      rewardStore.set({ date: todayString(), puzzles: next });
      return next.length % puzzlesPerReward === 0 ? 'granted' : 'progress';
    },
    [isLoggedIn],
  );

  return { bonus, canEarnMore, progress, puzzlesPerReward, onPuzzleComplete };
}
