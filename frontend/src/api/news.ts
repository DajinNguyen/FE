import { loadMockServer, request } from './client';
import type { NewsItem, NewsPage } from '../types';

/** 기업 뉴스 한 페이지에 받는 개수 */
export const NEWS_PAGE_SIZE = 10;

/** 기업 관련 뉴스 (최신순, 페이지 단위) */
export function getCompanyNews(stockCode: string, page = 1, size = NEWS_PAGE_SIZE) {
  return request<NewsPage>({
    path: `/api/companies/${stockCode}/news?page=${page}&size=${size}`,
    mock: async () => (await loadMockServer()).getCompanyNews(stockCode, page, size),
  });
}

/** 그날 시장 뉴스 (date: YYYY-MM-DD) */
export function getMarketNews(date: string) {
  return request<NewsItem[]>({
    path: `/api/market/news?date=${date}`,
    mock: async () => (await loadMockServer()).getMarketNews(date),
  });
}

/** 산업 페이지 "관련 뉴스" 개수 */
export const INDUSTRY_NEWS_SIZE = 5;

/** 산업 관련 뉴스 (최신순) */
export function getIndustryNews(industryId: string, size = INDUSTRY_NEWS_SIZE) {
  return request<NewsItem[]>({
    path: `/api/industries/${industryId}/news?size=${size}`,
    mock: async () => (await loadMockServer()).getIndustryNews(industryId, size),
  });
}
