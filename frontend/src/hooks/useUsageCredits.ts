import { useCallback } from 'react';
import { getUsageCredits, postPuzzleCompletion } from '../api/me';
import { PUZZLE_REWARD } from '../config/usagePolicy';
import {
  applyCompletion,
  emptyCredits,
  forToday,
  type PuzzleRewardResult,
} from '../features/crossword/puzzleReward';
import type { UsageCredits } from '../types';
import { localDate } from '../utils/date';
import { createSyncedRecord } from './syncedRecord';

export type { PuzzleRewardResult } from '../features/crossword/puzzleReward';

/** 서버에 아직 못 보낸 완료 기록을 차례로 보내고, 서버가 판단한 보상 상태를 받아요. */
async function sendCompletions(credits: UsageCredits): Promise<UsageCredits> {
  let latest: UsageCredits | null = null;
  for (const { synced, ...completion } of credits.completions) {
    if (synced !== false) continue;
    latest = await postPuzzleCompletion(completion);
  }
  return latest ?? (await getUsageCredits());
}

/** 못 보낸 완료 기록이 남아 있으면 서버 상태 위에 같은 규칙으로 다시 적용해요. */
function keepUnsent(server: UsageCredits, local: UsageCredits): UsageCredits {
  const today = localDate();
  const sent = new Set(server.completions.map((c) => `${c.puzzle_id}@${c.completed_at}`));
  return local.completions
    .filter((c) => c.synced === false && !sent.has(`${c.puzzle_id}@${c.completed_at}`))
    .reduce((acc, c) => applyCompletion(acc, c, { member: true, today }).credits, server);
}

const creditsRecord = createSyncedRecord<UsageCredits>({
  name: 'puzzle-rewards-v2',
  empty: emptyCredits,
  load: getUsageCredits,
  save: sendCompletions,
  merge: keepUnsent,
  // 비로그인 때 푼 퍼즐은 로그인해도 보상으로 옮기지 않아요. (악용 방지, 기기 기록은 그대로 둬요)
  isEmpty: () => true,
});

/** 낱말퀴즈 보상 Provider (AppProviders 에 있어요) */
export const UsageCreditsProvider = creditsRecord.Provider;

const { puzzlesPerReward, dailyMax } = PUZZLE_REWARD;

/**
 * 낱말퀴즈 보상: 정답 보기 없이 퍼즐 3개를 풀 때마다 리포트 만들기 1회 추가 (하루 최대 2회, 로그인 사용자만).
 * 로그인하면 완료 기록을 서버에 보내고 서버가 보상을 판단해요. 비로그인은 기기에 개수만 세요.
 */
export function useUsageCredits() {
  const { data, update, storage } = creditsRecord.useRecord();
  const member = storage === 'server';
  const today = forToday(data, localDate());
  const rewardsToday = member ? today.rewards_today : 0;
  const canEarnMore = member && rewardsToday < dailyMax;
  /** 다음 보상까지 푼 개수 (0~3). 오늘 보상을 다 받았으면 3 */
  const progress = member && !canEarnMore ? puzzlesPerReward : today.progress;

  /** 낱말퀴즈를 다 풀었을 때 불러요. */
  const onPuzzleComplete = useCallback(
    (puzzleId: string, { revealed }: { revealed: boolean }): PuzzleRewardResult => {
      let result: PuzzleRewardResult = 'progress';
      const now = new Date();
      update((prev) => {
        const applied = applyCompletion(
          prev,
          {
            puzzle_id: puzzleId,
            completed_at: now.toISOString(),
            revealed,
            // 로그인 사용자는 서버에 보내야 하는 기록이에요.
            ...(member ? { synced: false } : {}),
          },
          { member, today: localDate(now) },
        );
        result = applied.result;
        return applied.credits;
      });
      return result;
    },
    [update, member],
  );

  return {
    /** 오늘 받은 보상 = 리포트 만들기 추가 횟수 */
    bonus: rewardsToday,
    rewardsToday,
    dailyMax,
    canEarnMore,
    progress,
    puzzlesPerReward,
    onPuzzleComplete,
  };
}
