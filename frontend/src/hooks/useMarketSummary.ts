import { useQuery } from '@tanstack/react-query';
import { getMarketSummary } from '../api/market';

export function useMarketSummary() {
  return useQuery({
    queryKey: ['market', 'summary'],
    queryFn: getMarketSummary,
    staleTime: 5 * 60_000,
  });
}
