import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getPriceHistory } from '../api/companies';
import type { PriceInterval, PricePeriod } from '../types';

/** 백엔드가 시세를 1분마다 새로 받아서, 화면도 1분마다 다시 물어요 (창이 보일 때만). */
export const PRICE_REFRESH_MS = 60_000;

export function usePriceHistory(stockCode: string, period: PricePeriod, interval?: PriceInterval) {
  return useQuery({
    queryKey: ['companies', stockCode, 'prices', period, interval ?? null],
    queryFn: () => getPriceHistory(stockCode, period, interval),
    placeholderData: keepPreviousData,
    staleTime: PRICE_REFRESH_MS,
    refetchInterval: PRICE_REFRESH_MS,
  });
}
