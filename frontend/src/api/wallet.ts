import type { PuzzleCompletionResult, Wallet } from '../types';
import { request } from './client';

/** 로그인 사용자의 앰똥깡 잔액·낱말퀴즈 진행·최근 내역 */
export function getWallet() {
  return request<Wallet>({ path: '/api/me/wallet' });
}

/** 낱말퀴즈를 다 풀었다고 알려요. 진행도·보상 지급은 서버가 판단해요. */
export function postPuzzleCompletion(puzzleId: string, usedReveal: boolean) {
  return request<PuzzleCompletionResult>({
    path: '/api/me/puzzle-completions',
    method: 'POST',
    body: { puzzle_id: puzzleId, used_reveal: usedReveal },
  });
}
