import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getPriceHistory } from '../api/companies';
import type { PricePeriod } from '../types';

export function usePriceHistory(stockCode: string, period: PricePeriod) {
  return useQuery({
    queryKey: ['companies', stockCode, 'prices', period],
    queryFn: () => getPriceHistory(stockCode, period),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
