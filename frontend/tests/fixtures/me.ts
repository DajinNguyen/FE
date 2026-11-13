/**
 * 로그인 사용자 기록 목 서버 (메모리 저장): 학습 기록, 낱말퀴즈 보상.
 * 지금 요청한 사람은 session.ts 의 사용자예요. 없으면 401.
 */
import { ApiError } from '../../src/api/errors';
import { applyCompletion, emptyCredits, forToday } from '../../src/features/crossword/puzzleReward';
import type { PuzzleCompletion, TermProgress, UsageCredits } from '../../src/types';
import { localDate } from '../../src/utils/date';
import { getSessionUser } from './session';

const emptyProgress = (): TermProgress => ({ terms: {}, set_progress: [], study_dates: [] });

let termProgress = new Map<string, TermProgress>();
let credits = new Map<string, UsageCredits>();

function viewer() {
  const user = getSessionUser();
  if (!user) throw new ApiError('로그인이 필요해요', 401, 'UNAUTHORIZED');
  return user.id;
}

export async function getTermProgress(): Promise<TermProgress> {
  return termProgress.get(viewer()) ?? emptyProgress();
}

export async function putTermProgress(body: TermProgress): Promise<TermProgress> {
  termProgress.set(viewer(), body);
  return body;
}

/** 테스트에서 서버에 이미 있는 기록을 넣거나 확인할 때 */
export const serverTermProgress = {
  get: (userId: string) => termProgress.get(userId),
  set: (userId: string, progress: TermProgress) => termProgress.set(userId, progress),
};

/** 낱말퀴즈 보상: 실제 서버도 같은 규칙으로 판단해요 (중복 완료·시간 조작은 서버 시간 기준) */
export async function getUsageCredits(): Promise<UsageCredits> {
  return forToday(credits.get(viewer()) ?? emptyCredits, localDate());
}

export async function postPuzzleCompletion(body: PuzzleCompletion): Promise<UsageCredits> {
  const user = viewer();
  // 오늘 보상 판단은 기기 시간(completed_at)이 아니라 서버 시간으로 해요.
  const { credits: next } = applyCompletion(
    credits.get(user) ?? emptyCredits,
    { puzzle_id: body.puzzle_id, revealed: body.revealed, completed_at: body.completed_at },
    { member: true, today: localDate() },
  );
  credits.set(user, next);
  return next;
}

export const serverCredits = {
  get: (userId: string) => credits.get(userId),
  set: (userId: string, value: UsageCredits) => credits.set(userId, value),
};

export function resetMeStore() {
  termProgress = new Map();
  credits = new Map();
}
