/**
 * 로그인 사용자 기록 목 서버 (메모리 저장): 학습 기록, 관심 기업. (앰똥깡 지갑은 wallet.ts)
 * 지금 요청한 사람은 session.ts 의 사용자예요. 없으면 401.
 */
import { ApiError } from '../../src/api/errors';
import type { TermProgress, Watchlist } from '../../src/types';
import { getSessionUser } from './session';

const emptyProgress = (): TermProgress => ({ terms: {}, set_progress: [], study_dates: [] });

let termProgress = new Map<string, TermProgress>();
let watchlists = new Map<string, string[]>();

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

/** 백엔드 규칙: 보낸 순서 그대로, 같은 회사는 한 번만, 최대 200개 (넘으면 422) */
export async function getWatchlist(): Promise<Watchlist> {
  return { stock_codes: watchlists.get(viewer()) ?? [] };
}

export async function putWatchlist(body: Watchlist): Promise<Watchlist> {
  const user = viewer();
  const codes = [...new Set(body.stock_codes)];
  if (codes.length > 200) throw new ApiError('관심 기업은 200개까지예요', 422, 'VALIDATION_ERROR');
  watchlists.set(user, codes);
  return { stock_codes: codes };
}

/** 테스트에서 서버에 이미 있는 관심 기업을 넣거나 확인할 때 */
export const serverWatchlist = {
  get: (userId: string) => watchlists.get(userId),
  set: (userId: string, codes: string[]) => watchlists.set(userId, codes),
};

export function resetMeStore() {
  termProgress = new Map();
  watchlists = new Map();
}

/** PATCH /api/auth/me: 닉네임 바꾸기. 서버와 같은 규칙으로 검사하고, 이미 쓰는 닉네임은 409. */
const nicknames = new Map<string, string>();
export const takenNicknames = new Set<string>();

export const resetNicknames = () => {
  nicknames.clear();
  takenNicknames.clear();
};

export async function updateProfile(body: { nickname: string | null }) {
  const id = viewer();
  const nickname = (body.nickname ?? '').trim();
  if (nickname && takenNicknames.has(nickname.toLowerCase())) {
    throw new ApiError('이미 다른 사람이 쓰고 있는 닉네임이에요.', 409, 'NICKNAME_TAKEN');
  }
  nicknames.set(id, nickname || '자동닉네임1');
  return {
    id,
    email: `${id}@dajin.local`,
    name: '실명',
    nickname: nicknames.get(id)!,
    joined_at: '2026-11-01',
  };
}
