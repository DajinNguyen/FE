import type { TermProgress } from '../types';
import { request } from './client';

/** 로그인 사용자의 학습 기록 */
export function getTermProgress() {
  return request<TermProgress>({ path: '/api/me/term-progress' });
}

/** 학습 기록 전체를 한 번에 저장하고, 저장된 기록을 돌려받아요. */
export function putTermProgress(progress: TermProgress) {
  return request<TermProgress>({ path: '/api/me/term-progress', method: 'PUT', body: progress });
}
