import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getMockPortfolio, getMockTrades, postMockOrder } from '../api/mockInvest';
import type { MockOrderRequest } from '../types';
import { useAuth } from './useAuth';
import { userScope } from './userData';
import { useWallet } from './useWallet';

/** 계정별 쿼리 키. ['me', …] 아래라 로그아웃하면 resetUserData 가 지워요. */
const portfolioKey = (scope: string) => ['me', 'mock-invest', scope, 'portfolio'] as const;
const tradesKey = (scope: string) => ['me', 'mock-invest', scope, 'trades'] as const;

/** 내 모의투자 자산·보유 종목 (로그인 사용자만 불러요) */
export function useMockPortfolio() {
  const { user, isLoggedIn } = useAuth();
  const scope = userScope(user);
  const query = useQuery({
    queryKey: portfolioKey(scope),
    queryFn: getMockPortfolio,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });
  return { ...query, isLoggedIn, data: isLoggedIn ? query.data : undefined };
}

/** 내 거래 내역 */
export function useMockTrades() {
  const { user, isLoggedIn } = useAuth();
  return useQuery({
    queryKey: tradesKey(userScope(user)),
    queryFn: getMockTrades,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });
}

/** 사기·팔기. 성공하면 자산·내역·앰똥깡 잔액을 바로 갱신해요. */
export function useMockOrder() {
  const { user } = useAuth();
  const scope = userScope(user);
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const keys = useMemo(
    () => ({ portfolio: portfolioKey(scope), trades: tradesKey(scope) }),
    [scope],
  );

  return useMutation({
    mutationFn: (order: MockOrderRequest) => postMockOrder(order),
    onSuccess: (result) => {
      queryClient.setQueryData(keys.portfolio, result.portfolio);
      void queryClient.invalidateQueries({ queryKey: keys.trades });
      wallet.applyBalance(result.balance);
    },
    onError: () => {
      // 잔액·가격이 바뀌어 거절됐을 수 있어요. 최신 값으로 다시 불러와요.
      void queryClient.invalidateQueries({ queryKey: keys.portfolio });
      void wallet.refetch();
    },
  });
}
