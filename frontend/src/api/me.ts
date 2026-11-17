import type { TermProgress, Watchlist } from '../types';
import { request } from './client';

/** 로그인 사용자의 학습 기록 */
export function getTermProgress() {
  return request<TermProgress>({ path: '/api/me/term-progress' });
}

/** 학습 기록 전체를 한 번에 저장하고, 저장된 기록을 돌려받아요. */
export function putTermProgress(progress: TermProgress) {
  return request<TermProgress>({ path: '/api/me/term-progress', method: 'PUT', body: progress });
}

/** 로그인 사용자의 관심 기업 (없으면 빈 목록) */
export function getWatchlist() {
  return request<Watchlist>({ path: '/api/me/watchlist' });
}

/** 관심 기업 전체 목록을 저장하고, 서버가 정리한 목록(중복·없는 종목 제외)을 돌려받아요. */
export function putWatchlist(watchlist: Watchlist) {
  return request<Watchlist>({ path: '/api/me/watchlist', method: 'PUT', body: watchlist });
}
