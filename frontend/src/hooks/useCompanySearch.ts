import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCompanies } from '../api/companies';
import { useDebouncedValue } from './useDebouncedValue';

/** 입력이 멈추고 이만큼 지나면 검색해요. */
export const SEARCH_DEBOUNCE_MS = 300;

export function useCompanySearch(query: string) {
  const keyword = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const result = useQuery({
    queryKey: ['companies', 'search', keyword],
    queryFn: () => searchCompanies(keyword),
    enabled: keyword.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  return { ...result, keyword };
}
