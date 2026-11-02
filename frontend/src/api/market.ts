import { loadMockServer, request } from './client';
import type { MarketSummary } from '../types';

/** 메인 "오늘의 시장": 한마디, 지수, 움직인 이유 */
export function getMarketSummary() {
  return request<MarketSummary>({
    path: '/api/market/summary',
    mock: async () => (await loadMockServer()).getMarketSummary(),
  });
}
