import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCompanyNews, getIndustryNews, getMarketNews } from '../api/news';

/** 기업 뉴스. [더 보기]를 누르면 다음 페이지를 이어 붙여요. */
export function useCompanyNews(stockCode: string) {
  const query = useInfiniteQuery({
    queryKey: ['companies', stockCode, 'news'],
    queryFn: ({ pageParam }) => getCompanyNews(stockCode, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
    staleTime: 5 * 60_000,
  });
  return { ...query, items: query.data?.pages.flatMap((p) => p.items) ?? [] };
}

/** 그날 시장 뉴스 (date: YYYY-MM-DD) */
export function useMarketNews(date: string) {
  return useQuery({
    queryKey: ['market', 'news', date],
    queryFn: () => getMarketNews(date),
    staleTime: 5 * 60_000,
  });
}

/** 산업 관련 뉴스 */
export function useIndustryNews(industryId: string) {
  return useQuery({
    queryKey: ['industries', industryId, 'news'],
    queryFn: () => getIndustryNews(industryId),
    staleTime: 5 * 60_000,
  });
}
