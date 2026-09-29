import { useQuery } from '@tanstack/react-query';
import { getNews } from '../api/companies';

export function useNews(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'news'],
    queryFn: () => getNews(stockCode),
    staleTime: 5 * 60_000,
  });
}
