import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCompanies } from '../api/companies';
import { useDebouncedValue } from './useDebouncedValue';

export function useCompanySearch(query: string) {
  const keyword = useDebouncedValue(query.trim(), 150);
  const result = useQuery({
    queryKey: ['companies', 'search', keyword],
    queryFn: () => searchCompanies(keyword),
    enabled: keyword.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  return { ...result, keyword };
}
