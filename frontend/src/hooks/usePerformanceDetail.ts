import { useQuery } from '@tanstack/react-query';
import { getPerformanceDetail } from '../api/companies';

export function usePerformanceDetail(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'performance'],
    queryFn: () => getPerformanceDetail(stockCode),
    staleTime: 5 * 60_000,
  });
}
