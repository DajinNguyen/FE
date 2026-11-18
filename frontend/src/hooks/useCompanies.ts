import { useQuery } from '@tanstack/react-query';
import { getCompaniesByCodes, getCompany, getCompanyCompare, getPeers } from '../api/companies';
import { pollWhileGenerating } from './generationPolling';

export function useCompaniesByCodes(stockCodes: string[]) {
  return useQuery({
    queryKey: ['companies', 'by-codes', stockCodes],
    queryFn: () => getCompaniesByCodes(stockCodes),
    enabled: stockCodes.length > 0,
  });
}

/** 두 회사 비교 */
export function useCompanyCompare(left: string | null, right: string) {
  return useQuery({
    queryKey: ['companies', 'compare', left, right],
    queryFn: () => getCompanyCompare(left!, right),
    enabled: left !== null,
    staleTime: 5 * 60_000,
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
    // 처음 연 회사는 AI가 개요를 만드는 중이에요. 다 될 때까지 다시 물어봐요
    refetchInterval: (q) => pollWhileGenerating(q.state.data?.overview_status),
    enabled: stockCode !== '',
  });
}
