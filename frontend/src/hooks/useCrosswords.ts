import { skipToken, useQuery } from '@tanstack/react-query';
import { getCrosswordPuzzle, getCrosswordPuzzles } from '../api/crosswords';

export function useCrosswordPuzzles() {
  return useQuery({
    queryKey: ['crosswords'],
    queryFn: getCrosswordPuzzles,
    staleTime: Infinity,
  });
}

/** 퍼즐 하나. id가 아직 없으면(목록을 받는 중) 요청하지 않아요. */
export function useCrosswordPuzzle(puzzleId: string | undefined) {
  return useQuery({
    queryKey: ['crosswords', puzzleId],
    // skipToken: id가 없으면 refetch()를 불러도 요청하지 않아요.
    queryFn: puzzleId ? () => getCrosswordPuzzle(puzzleId) : skipToken,
    staleTime: Infinity,
  });
}
