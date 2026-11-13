import type { PuzzleCompletion, TermProgress, UsageCredits } from '../types';
import { request } from './client';

/** 로그인 사용자의 학습 기록 */
export function getTermProgress() {
  return request<TermProgress>({ path: '/api/me/term-progress' });
}

/** 학습 기록 전체를 한 번에 저장하고, 저장된 기록을 돌려받아요. */
export function putTermProgress(progress: TermProgress) {
  return request<TermProgress>({ path: '/api/me/term-progress', method: 'PUT', body: progress });
}

/** 낱말퀴즈 보상 (오늘 받은 보상 횟수, 다음 보상까지 센 퍼즐 수, 완료 기록) */
export function getUsageCredits() {
  return request<UsageCredits>({ path: '/api/me/usage-credits' });
}

/** 낱말퀴즈 완료를 알려요. 보상 지급은 서버가 판단하고, 바뀐 보상 상태를 돌려줘요. */
export function postPuzzleCompletion(completion: PuzzleCompletion) {
  return request<UsageCredits>({
    path: '/api/me/puzzle-completions',
    method: 'POST',
    body: completion,
  });
}
