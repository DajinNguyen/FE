import { request } from './client';
import type {
  CrosswordCheckResult,
  CrosswordHintResult,
  CrosswordPuzzle,
  CrosswordRevealResult,
  CrosswordSummary,
} from '../types';

/** 가로세로 낱말퀴즈 목록 */
export function getCrosswordPuzzles() {
  return request<CrosswordSummary[]>({ path: '/api/learn/crosswords' });
}

/** 퍼즐 하나 (칸 수·열쇠 포함. 정답은 없어요) */
export function getCrosswordPuzzle(puzzleId: string) {
  return request<CrosswordPuzzle>({ path: `/api/learn/crosswords/${puzzleId}` });
}

/** 채운 칸이 맞는지 서버가 확인해요. (로그인 전에도 쓸 수 있어요) */
export function checkCrossword(puzzleId: string, entries: Record<string, string>) {
  return request<CrosswordCheckResult>({
    path: `/api/learn/crosswords/${puzzleId}/check`,
    method: 'POST',
    body: { entries },
  });
}

/** 단어의 힌트 (1단계 초성, 2단계 첫 글자) */
export function hintCrossword(puzzleId: string, wordIndex: number, level: 1 | 2) {
  return request<CrosswordHintResult>({
    path: `/api/learn/crosswords/${puzzleId}/hint`,
    method: 'POST',
    body: { word_index: wordIndex, level },
  });
}

/** 정답 보기: 서버가 모든 칸의 정답을 줘요. 로그인했다면 서버가 이 퀴즈를 보상에서 빼요. */
export function revealCrossword(puzzleId: string) {
  return request<CrosswordRevealResult>({
    path: `/api/learn/crosswords/${puzzleId}/reveal`,
    method: 'POST',
  });
}
