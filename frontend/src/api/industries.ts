import { request } from './client';
import type { HeatPeriod, IndustryDetail, IndustryListItem, IndustrySummary } from '../types';

/** 전체 산업(키워드) 목록 */
export function getIndustries() {
  return request<IndustryListItem[]>({ path: '/api/industries' });
}

/** 메인 "지금 관심이 몰리는 산업" (점수 높은 순) */
export function getHotIndustries(period: HeatPeriod) {
  return request<IndustrySummary[]>({
    path: `/api/industries/hot?period=${period}`,
  });
}

/** 산업 페이지 */
export function getIndustry(industryId: string) {
  return request<IndustryDetail>({
    path: `/api/industries/${industryId}`,
  });
}
