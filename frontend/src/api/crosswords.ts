import { loadMockServer, request } from './client';
import type { CrosswordPuzzle, CrosswordSummary } from '../types';

/** 가로세로 낱말퀴즈 목록 */
export function getCrosswordPuzzles() {
  return request<CrosswordSummary[]>({
    path: '/api/learn/crosswords',
    mock: async () => (await loadMockServer()).getCrosswordPuzzles(),
  });
}

/** 퍼즐 하나 (칸·열쇠 포함) */
export function getCrosswordPuzzle(puzzleId: string) {
  return request<CrosswordPuzzle>({
    path: `/api/learn/crosswords/${puzzleId}`,
    mock: async () => (await loadMockServer()).getCrosswordPuzzle(puzzleId),
  });
}
