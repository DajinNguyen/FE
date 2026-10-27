import { useQuery } from '@tanstack/react-query';
import { getHotIndustries } from '../api/industries';
import type { HeatPeriod } from '../types';

export function useHotIndustries(period: HeatPeriod) {
  return useQuery({
    queryKey: ['industries', 'hot', period],
    queryFn: () => getHotIndustries(period),
    staleTime: 5 * 60_000,
  });
}
