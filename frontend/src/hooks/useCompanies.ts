import { useQuery } from '@tanstack/react-query';
import { getCompaniesByCodes, getCompany, getCompanyCompare, getPeers } from '../api/companies';
import { pollWhileGenerating } from './generationPolling';
import { PRICE_REFRESH_MS } from './usePriceHistory';

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
    staleTime: PRICE_REFRESH_MS,
    // 처음 연 회사는 AI가 개요를 만드는 중이에요. 다 될 때까지 다시 물어봐요.
    // 아니면 현재가가 그래프와 같이 바뀌도록 시세 주기마다 다시 받아요 (창이 보일 때만)
    refetchInterval: (q) => pollWhileGenerating(q.state.data?.overview_status) || PRICE_REFRESH_MS,
    enabled: stockCode !== '',
  });
}
