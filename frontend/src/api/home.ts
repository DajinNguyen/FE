import { loadMockServer, request } from './client';
import type { HomeDashboard } from '../types';

/** 메인 대시보드 (거래 많은 기업, 떠오르는 기업, 관심도 높은 기업, AI가 분석한 기업) */
export function getHomeDashboard() {
  return request<HomeDashboard>({
    path: '/api/home',
    mock: async () => (await loadMockServer()).getHomeDashboard(),
  });
}
