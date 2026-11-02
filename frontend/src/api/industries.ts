import { loadMockServer, request } from './client';
import type { HeatPeriod, IndustryDetail, IndustrySummary } from '../types';

/** 메인 "지금 관심이 몰리는 산업" (점수 높은 순) */
export function getHotIndustries(period: HeatPeriod) {
  return request<IndustrySummary[]>({
    path: `/api/industries/hot?period=${period}`,
    mock: async () => (await loadMockServer()).getHotIndustries(period),
  });
}

/** 산업 페이지 */
export function getIndustry(industryId: string) {
  return request<IndustryDetail>({
    path: `/api/industries/${industryId}`,
    mock: async () => (await loadMockServer()).getIndustry(industryId),
  });
}
