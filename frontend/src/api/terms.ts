import { request } from './client';
import type { Term } from '../types';

/** 용어 사전 (낱말퀴즈·용어 카드·문제·용어 설명에 같이 써요) */
export function getTerms() {
  return request<Term[]>({ path: '/api/terms' });
}
