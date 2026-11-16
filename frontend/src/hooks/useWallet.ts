import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getWallet, postPuzzleCompletion } from '../api/wallet';
import type { PuzzleCompletionResult, Wallet } from '../types';
import { useAuth } from './useAuth';
import { userScope } from './userData';

/** 계정별 지갑 쿼리 키. ['me', …] 아래라 로그아웃하면 resetUserData 가 지워요. */
export const walletKey = (scope: string) => ['me', 'wallet', scope] as const;

/**
 * 앰똥깡(ADK) 지갑. 헤더 배지·리포트·챗봇·낱말퀴즈가 함께 써요.
 * 로그인 사용자만 서버에서 불러오고, 비로그인은 wallet 이 없어요. (기기에 저장하지 않아요)
 * 지급·차감 판단은 서버가 하고, 화면은 서버가 돌려준 잔액으로 바로 갱신해요.
 */
export function useWallet() {
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const scope = userScope(user);
  const key = useMemo(() => walletKey(scope), [scope]);

  const query = useQuery({
    queryKey: key,
    queryFn: getWallet,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });
  const wallet = isLoggedIn ? query.data : undefined;
  const balance = wallet?.balance ?? null;

  /** 서버가 알려준 새 잔액을 바로 보여주고, 내역은 다시 불러와요. */
  const applyBalance = useCallback(
    (next: number) => {
      queryClient.setQueryData<Wallet>(key, (old) => (old ? { ...old, balance: next } : old));
      void queryClient.invalidateQueries({ queryKey: key });
    },
    [queryClient, key],
  );

  /** 낱말퀴즈를 다 풀었을 때 (로그인 사용자만). 실패하면 null */
  const completePuzzle = useCallback(
    async (puzzleId: string, usedReveal: boolean): Promise<PuzzleCompletionResult | null> => {
      if (!isLoggedIn) return null;
      try {
        const result = await postPuzzleCompletion(puzzleId, usedReveal);
        queryClient.setQueryData<Wallet>(key, (old) =>
          old
            ? {
                ...old,
                balance: result.balance,
                puzzle_progress: result.puzzle_progress,
                reward_count_today: result.reward_count_today,
                reward_daily_limit: result.reward_daily_limit,
              }
            : old,
        );
        void queryClient.invalidateQueries({ queryKey: key });
        return result;
      } catch {
        return null;
      }
    },
    [isLoggedIn, queryClient, key],
  );

  return {
    isLoggedIn,
    wallet,
    balance,
    isLoading: isLoggedIn && query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    /** 잔액이 비용 이상인지. 잔액을 모르면(불러오는 중·실패) false */
    canAfford: (cost: number) => balance !== null && balance >= cost,
    applyBalance,
    completePuzzle,
  };
}
