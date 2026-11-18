import { useQuery } from '@tanstack/react-query';
import { getFinancials } from '../api/companies';
import { pollWhileGenerating } from './generationPolling';

export function useFinancials(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'financials'],
    queryFn: () => getFinancials(stockCode),
    staleTime: 5 * 60_000,
    refetchInterval: (q) => pollWhileGenerating(q.state.data?.segments_status),
  });
}
