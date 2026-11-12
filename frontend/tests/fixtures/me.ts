/**
 * 로그인 사용자 기록 목 서버 (메모리 저장): 학습 기록.
 * 지금 요청한 사람은 session.ts 의 사용자예요. 없으면 401.
 */
import { ApiError } from '../../src/api/errors';
import type { TermProgress } from '../../src/types';
import { getSessionUser } from './session';

const emptyProgress = (): TermProgress => ({ terms: {}, set_progress: [], study_dates: [] });

let termProgress = new Map<string, TermProgress>();

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

export function resetMeStore() {
  termProgress = new Map();
}
