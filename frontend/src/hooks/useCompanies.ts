import { useQuery } from '@tanstack/react-query';
import { getCompaniesByCodes, getCompany, getPeers } from '../api/companies';

export function useCompaniesByCodes(stockCodes: string[]) {
  return useQuery({
    queryKey: ['companies', 'by-codes', stockCodes],
    queryFn: () => getCompaniesByCodes(stockCodes),
    enabled: stockCodes.length > 0,
  });
}

/** 같은 산업의 비슷한 회사 (비교하기 추천) */
export function usePeers(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'peers'],
    queryFn: () => getPeers(stockCode),
    staleTime: 5 * 60_000,
  });
}

export function useCompany(stockCode: string) {
  return useQuery({
    queryKey: ['companies', stockCode, 'detail'],
    queryFn: () => getCompany(stockCode),
    staleTime: 60_000,
    enabled: stockCode !== '',
  });
}
