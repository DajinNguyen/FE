import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ADK_NOTICE } from '../config/currency';
import { MOCK_INVEST_NOTICE, MOCK_INVEST_SHARED_ADK_TEXT } from '../config/mockInvest';
import { useChatContext } from '../features/chat/chatContextStore';
import { MockAllocation } from '../features/mock-invest/MockAllocation';
import { MockAssets } from '../features/mock-invest/MockAssets';
import { MockHoldings } from '../features/mock-invest/MockHoldings';
import { MockOrderPanel } from '../features/mock-invest/MockOrderPanel';
import { MockTrades } from '../features/mock-invest/MockTrades';
import type { OrderRequest } from '../features/mock-invest/orderRequest';
import { useMockPortfolio } from '../hooks/useMockInvest';
import { useRequireLogin } from '../hooks/useRequireLogin';
import styles from '../features/mock-invest/MockInvest.module.css';

/**
 * 모의투자 화면 (/mock-invest): 내 자산 · 주문 · 보유 종목 · 거래 내역
 * 1안 ADK 단일 · 지연 시세 · 초기화 없음. 다른 사용자와의 수익률 순위는 없어요.
 * 비로그인으로 들어오면 로그인 시트를 띄워요.
 */
export function MockInvestPage() {
  const { data, isLoggedIn, isPending, isError, error, refetch } = useMockPortfolio();
  const requireLogin = useRequireLogin();
  useChatContext({ page: 'other' });
  const [request, setRequest] = useState<OrderRequest | null>(null);

  // 비로그인으로 들어오면 한 번 로그인 시트를 띄워요.
  const asked = useRef(false);
  useEffect(() => {
    if (isLoggedIn || asked.current) return;
    asked.current = true;
    requireLogin(undefined, 'mockInvest');
  }, [isLoggedIn, requireLogin]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>모의투자</h1>
        <p className={styles.subtitle}>{MOCK_INVEST_NOTICE}</p>
      </header>

      {!isLoggedIn ? (
        <EmptyState
          title="로그인하면 모의투자를 할 수 있어요"
          description={ADK_NOTICE}
          action={
            <Button onClick={() => requireLogin(undefined, 'mockInvest')}>Google로 로그인</Button>
          }
        />
      ) : isError ? (
        <ErrorState
          title="모의투자 정보를 불러오지 못했어요"
          error={error}
          onRetry={() => refetch()}
        />
      ) : isPending || !data ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : (
        <div className={styles.layout}>
          <div className={styles.areaAssets}>
            <MockAssets portfolio={data} />
          </div>
          <div className={styles.areaOrder}>
            <MockOrderPanel portfolio={data} request={request} />
          </div>
          <div className={styles.areaAllocation}>
            <MockAllocation portfolio={data} />
          </div>
          <div className={styles.areaHoldings}>
            <MockHoldings
              holdings={data.holdings}
              onTrade={(h, side) =>
                setRequest((prev) => ({
                  stock_code: h.stock_code,
                  name: h.name,
                  side,
                  price: h.current_price,
                  nonce: (prev?.nonce ?? 0) + 1,
                }))
              }
            />
          </div>
          <div className={styles.areaTrades}>
            <MockTrades />
          </div>
        </div>
      )}

      <p className={styles.notice}>
        {MOCK_INVEST_SHARED_ADK_TEXT}. {ADK_NOTICE}. 초기화는 할 수 없어요.
      </p>
    </div>
  );
}
