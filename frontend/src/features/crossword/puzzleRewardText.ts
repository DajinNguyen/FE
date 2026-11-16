import { formatAdk, PUZZLE_REWARD } from '../../config/currency';
import type { PuzzleCompletionResult } from '../../types';

/**
 * 낱말퀴즈를 다 풀었을 때 보상 안내 (진행도·지급은 서버가 판단해요)
 * guest   : 비로그인 — 진행도·보상 없음
 * revealed: 정답 보기를 써서 세지 않아요
 * failed  : 서버에 알리지 못했어요
 */
export type PuzzleRewardView =
  | { kind: 'guest' }
  | { kind: 'revealed' }
  | { kind: 'failed' }
  | { kind: 'result'; result: PuzzleCompletionResult };

const reward = formatAdk(PUZZLE_REWARD.amount);

export function puzzleRewardText(view: PuzzleRewardView) {
  switch (view.kind) {
    case 'guest':
      return `로그인하면 ${PUZZLE_REWARD.puzzlesPerReward}개마다 ${reward}를 받을 수 있어요`;
    case 'revealed':
      return '정답 보기를 사용한 퀴즈는 개수에 포함되지 않아요';
    case 'failed':
      return '보상 기록을 저장하지 못했어요. 잠시 후 내 앰똥깡에서 확인해 주세요';
    case 'result': {
      const { rewarded, puzzle_progress, reward_count_today, reward_daily_limit } = view.result;
      if (rewarded) {
        return `+${reward}를 받았어요 (오늘 보상 ${reward_count_today}/${reward_daily_limit})`;
      }
      if (reward_count_today >= reward_daily_limit) return '오늘 받을 수 있는 보상을 모두 받았어요';
      return `${reward}까지 낱말퀴즈 ${puzzle_progress.done}/${puzzle_progress.required}`;
    }
  }
}
