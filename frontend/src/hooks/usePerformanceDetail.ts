import { useQuery } from '@tanstack/react-query';
import { getPerformanceDetail } from '../api/companies';
import { pollWhileGenerating } from './generationPolling';

export function usePerformanceDetail(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'performance'],
    queryFn: () => getPerformanceDetail(stockCode),
    staleTime: 5 * 60_000,
    refetchInterval: (q) =>
      pollWhileGenerating(q.state.data?.segments_status, q.state.data?.reasons_status),
  });
}
