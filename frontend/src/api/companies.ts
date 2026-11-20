import { request } from './client';
import { ApiError } from './errors';
import type {
  CompanyCompare,
  CompanyDetail,
  CompanyReport,
  CompanySummary,
  Financials,
  PerformanceDetail,
  PriceHistory,
  PriceInterval,
  PricePeriod,
} from '../types';

/** 검색 결과는 최대 20개까지 받아요. */
export const SEARCH_LIMIT = 20;

export function searchCompanies(query: string) {
  return request<CompanySummary[]>({
    path: `/api/companies?query=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`,
  });
}

export function getCompaniesByCodes(stockCodes: string[]) {
  return request<CompanySummary[]>({
    path: `/api/companies?stock_codes=${stockCodes.join(',')}`,
  });
}

/** 두 회사 비교 (왼쪽 = 비교할 기업, 오른쪽 = 지금 보는 기업) */
export function getCompanyCompare(left: string, right: string) {
  return request<CompanyCompare>({
    path: `/api/companies/compare?left=${encodeURIComponent(left)}&right=${encodeURIComponent(right)}`,
  });
}

/** 같은 산업의 비슷한 회사 (비교하기 추천 칩, 최대 4개) */
export function getPeers(stockCode: string) {
  return request<CompanySummary[]>({ path: `/api/companies/${stockCode}/peers` });
}

export function getCompany(stockCode: string) {
  return request<CompanyDetail>({
    path: `/api/companies/${stockCode}`,
  });
}

export function getFinancials(stockCode: string) {
  return request<Financials>({
    path: `/api/companies/${stockCode}/financials`,
  });
}

/** 재무 상세 "최근 사업 성과 분석" (실적 요약·비교·분기 흐름·사업별·이유·출처) */
export function getPerformanceDetail(stockCode: string) {
  return request<PerformanceDetail>({
    path: `/api/companies/${stockCode}/performance`,
  });
}

/** interval 을 빼면 백엔드가 기간에 맞춰 정해요 (1d→1분, 5d→10분, 1m~6m→일, 1y·5y→주, 전체→월) */
export function getPriceHistory(stockCode: string, period: PricePeriod, interval?: PriceInterval) {
  const query = new URLSearchParams({ period, ...(interval ? { interval } : {}) });
  return request<PriceHistory>({
    path: `/api/companies/${stockCode}/prices?${query}`,
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
/** 만들기 요청. 서버가 7 ADK 를 빼고 남은 잔액(balance)을 함께 보내요. (실패하면 서버가 되돌려요) */
export function generateReport(stockCode: string) {
  return request<CompanyReport & { balance?: number }>({
    path: `/api/companies/${stockCode}/report`,
    method: 'POST',
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
