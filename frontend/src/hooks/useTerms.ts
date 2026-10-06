import { useQuery } from '@tanstack/react-query';
import { getTerms } from '../api/terms';

export function useTerms() {
  return useQuery({
    queryKey: ['terms'],
    queryFn: getTerms,
    staleTime: Infinity,
  });
}
