import { useQuery } from '@tanstack/react-query';
import { getCrosswordPuzzle, getCrosswordPuzzles } from '../api/crosswords';

export function useCrosswordPuzzles() {
  return useQuery({
    queryKey: ['crosswords'],
    queryFn: getCrosswordPuzzles,
    staleTime: Infinity,
  });
}

export function useCrosswordPuzzle(puzzleId: string) {
  return useQuery({
    queryKey: ['crosswords', puzzleId],
    queryFn: () => getCrosswordPuzzle(puzzleId),
    staleTime: Infinity,
  });
}
