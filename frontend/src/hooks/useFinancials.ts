import { useQuery } from '@tanstack/react-query';
import { getFinancials } from '../api/companies';

export function useFinancials(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'financials'],
    queryFn: () => getFinancials(stockCode),
    staleTime: 5 * 60_000,
  });
}
