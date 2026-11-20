import type { PuzzleCompletionResult, Wallet } from '../types';
import { request } from './client';

/** 로그인 사용자의 앰똥깡 잔액·낱말퀴즈 진행·최근 내역 */
export function getWallet() {
  return request<Wallet>({ path: '/api/me/wallet' });
}

/**
 * 낱말퀴즈를 다 풀었다고 알려요. 마지막으로 채운 칸(entries)을 같이 보내면 서버가 정답과 비교해서
 * 진행도·보상 지급을 판단해요.
 */
export function postPuzzleCompletion(
  puzzleId: string,
  usedReveal: boolean,
  entries: Record<string, string>,
) {
  return request<PuzzleCompletionResult>({
    path: '/api/me/puzzle-completions',
    method: 'POST',
    body: { puzzle_id: puzzleId, used_reveal: usedReveal, entries },
  });
}
