import { useQuery } from '@tanstack/react-query';
import { getCompaniesByCodes, getCompany } from '../api/companies';

export function useCompaniesByCodes(stockCodes: string[]) {
  return useQuery({
    queryKey: ['companies', 'by-codes', stockCodes],
    queryFn: () => getCompaniesByCodes(stockCodes),
    enabled: stockCodes.length > 0,
  });
}

export function useCompany(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'detail'],
    queryFn: () => getCompany(stockCode),
    staleTime: 60_000,
  });
}
