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

/** 검색 결과는 최대 20개까지 받아요. */
export const SEARCH_LIMIT = 20;

export function searchCompanies(query: string) {
  return request<CompanySummary[]>({
    path: `/api/companies?query=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`,
    mock: async () => (await loadMockServer()).searchCompanies(query, SEARCH_LIMIT),
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

/**
 * AI 리포트의 지금 상태. 아직 만든 적이 없으면 status: "none" 이에요.
 * (백엔드가 404로 알려주는 경우도 "none" 으로 바꿔서 화면 코드는 한 가지만 보면 돼요.)
 */
export async function getCompanyReport(stockCode: string): Promise<CompanyReport> {
  try {
    return await request<CompanyReport>({
      path: `/api/companies/${stockCode}/report`,
      mock: async () => (await loadMockServer()).getCompanyReport(stockCode),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code !== 'COMPANY_NOT_FOUND') {
      return emptyReport(stockCode);
    }
    throw error;
  }
}

/**
 * AI 리포트를 새로 만들기 시작해요. (이미 있어도 새로 만들어서 덮어써요)
 * 응답이 status: "generating" 이면 훅이 GET 으로 다 될 때까지 다시 물어봐요(폴링).
 * 백엔드가 바로 "done" 을 돌려줘도 그대로 동작해요.
 */
export function generateReport(stockCode: string) {
  return request<CompanyReport>({
    path: `/api/companies/${stockCode}/report`,
    method: 'POST',
    mock: async () => (await loadMockServer()).generateReport(stockCode),
  });
}

const emptyReport = (stockCode: string): CompanyReport => ({
  stock_code: stockCode,
  status: 'none',
  generated_at: null,
  headline: '',
  key_points: [],
  evidence: { financials: null, news: [], vision: null },
  quiz: [],
  sources: [],
  failure_reason: null,
});
