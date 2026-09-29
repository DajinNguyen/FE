import { loadMockServer, request } from './client';
import { ApiError } from './errors';
import type {
  CompanyDetail,
  CompanyReport,
  CompanySummary,
  Financials,
  NewsItem,
  PriceHistory,
  PricePeriod,
} from '../types';

export function searchCompanies(query: string) {
  return request<CompanySummary[]>({
    path: `/api/companies?query=${encodeURIComponent(query)}`,
    mock: async () => (await loadMockServer()).searchCompanies(query),
  });
}

export function getPopularCompanies() {
  return request<CompanySummary[]>({
    path: '/api/companies/popular',
    mock: async () => (await loadMockServer()).getPopularCompanies(),
  });
}

export function getCompaniesByCodes(stockCodes: string[]) {
  return request<CompanySummary[]>({
    path: `/api/companies?stock_codes=${stockCodes.join(',')}`,
    mock: async () => (await loadMockServer()).getCompaniesByCodes(stockCodes),
  });
}

export function getCompany(stockCode: string) {
  return request<CompanyDetail>({
    path: `/api/companies/${stockCode}`,
    mock: async () => (await loadMockServer()).getCompany(stockCode),
  });
}

export function getFinancials(stockCode: string) {
  return request<Financials>({
    path: `/api/companies/${stockCode}/financials`,
    mock: async () => (await loadMockServer()).getFinancials(stockCode),
  });
}

export function getNews(stockCode: string) {
  return request<NewsItem[]>({
    path: `/api/companies/${stockCode}/news`,
    mock: async () => (await loadMockServer()).getNews(stockCode),
  });
}

export function getPriceHistory(stockCode: string, period: PricePeriod) {
  return request<PriceHistory>({
    path: `/api/companies/${stockCode}/prices?period=${period}`,
    mock: async () => (await loadMockServer()).getPriceHistory(stockCode, period),
  });
}

/** 저장된 AI 리포트. 아직 만든 적이 없으면(404) null 을 돌려줘요. */
export async function getSavedReport(stockCode: string): Promise<CompanyReport | null> {
  try {
    return await request<CompanyReport>({
      path: `/api/companies/${stockCode}/report`,
      mock: async () => (await loadMockServer()).getSavedReport(stockCode),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * AI 리포트를 새로 만들어요. (저장된 리포트가 있어도 새로 만들어서 덮어써요)
 * 생성이 오래 걸리게 되면 여기만 "작업 시작 → 상태 조회(폴링/SSE)" 방식으로 바꾸면 돼요.
 */
export function generateReport(stockCode: string) {
  return request<CompanyReport>({
    path: `/api/companies/${stockCode}/report`,
    method: 'POST',
    mock: async () => (await loadMockServer()).generateReport(stockCode),
  });
}
