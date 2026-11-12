import { PUZZLE_REWARD } from '../../config/usagePolicy';
import type { UsageCredits } from '../../types';

/**
 * granted  : 이번 퍼즐로 3개를 채워 1회 추가
 * progress : 셌지만 아직 3개가 안 됐어요
 * revealed : 정답 보기를 써서 세지 않아요
 * guest    : 로그인하지 않아서 개수만 세요 (보상 없음)
 * daily-max: 오늘 보상을 다 받았어요
 * already  : 오늘 이미 센 퍼즐이에요
 */
export type PuzzleRewardResult =
  'granted' | 'progress' | 'revealed' | 'guest' | 'daily-max' | 'already';

/** 완료 기록은 최근 이만큼만 남겨요. */
const KEEP_COMPLETIONS = 50;

export const emptyCredits: UsageCredits = {
  date: '',
  rewards_today: 0,
  progress: 0,
  counted_today: [],
  completions: [],
};

/** 날짜가 바뀌었으면 오늘 보상 횟수를 0으로 (센 퍼즐 수는 설정에 따라 남겨요) */
export function forToday(credits: UsageCredits, today: string): UsageCredits {
  if (credits.date === today) return credits;
  return {
    ...credits,
    date: today,
    rewards_today: 0,
    counted_today: [],
    progress: PUZZLE_REWARD.keepProgressAcrossDays ? credits.progress : 0,
  };
}

/**
 * 낱말퀴즈를 다 풀었을 때 보상 규칙을 적용해요. (화면에 바로 보여주기 위한 계산이고, 로그인 사용자는 서버가 다시 판단해요)
 * 비로그인은 개수(최대 3/3)만 세고 보상은 주지 않아요.
 */
export function applyCompletion(
  credits: UsageCredits,
  completion: UsageCredits['completions'][number],
  { member, today }: { member: boolean; today: string },
): { credits: UsageCredits; result: PuzzleRewardResult } {
  const { puzzlesPerReward, dailyMax, membersOnly } = PUZZLE_REWARD;
  const current = forToday(credits, today);
  const logged = {
    ...current,
    completions: [...current.completions, completion].slice(-KEEP_COMPLETIONS),
  };

  if (completion.revealed) return { credits: logged, result: 'revealed' };
  if (current.counted_today.includes(completion.puzzle_id)) {
    return { credits: logged, result: 'already' };
  }
  const rewarded = member || !membersOnly;
  if (rewarded && current.rewards_today >= dailyMax) {
    return { credits: logged, result: 'daily-max' };
  }

  const counted = [...current.counted_today, completion.puzzle_id];
  const progress = current.progress + 1;
  if (!rewarded) {
    // 비로그인: 3/3 에서 멈추고 "로그인하면 보상을 받을 수 있어요"
    const capped = Math.min(progress, puzzlesPerReward);
    return { credits: { ...logged, counted_today: counted, progress: capped }, result: 'guest' };
  }
  if (progress >= puzzlesPerReward) {
    return {
      credits: {
        ...logged,
        counted_today: counted,
        progress: 0,
        rewards_today: current.rewards_today + 1,
      },
      result: 'granted',
    };
  }
  return { credits: { ...logged, counted_today: counted, progress }, result: 'progress' };
}
