import { useQuery } from '@tanstack/react-query';
import { getHomeDashboard } from '../api/home';

export function useHomeDashboard() {
  return useQuery({
    queryKey: ['home'],
    queryFn: getHomeDashboard,
    staleTime: 60_000,
  });
}
