import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError, errorReason } from '../../api/errors';
import { Button } from '../../components/Button';
import { CompanySearch } from '../../components/CompanySearch';
import { DataAsOf } from '../../components/DataAsOf';
import { MAX_ORDER_QUANTITY, MOCK_PRICE_BASIS_TEXT } from '../../config/mockInvest';
import { PriceChart } from '../../components/PriceChart';
import { useCompany } from '../../hooks/useCompanies';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import { useMockOrder } from '../../hooks/useMockInvest';
import type { CompanySummary, MockOrderSide, MockPortfolio, MockTrade } from '../../types';
import type { OrderRequest } from './orderRequest';
import { formatRate, formatWon, toneOf, toneWords } from './mockInvestFormat';
import styles from './MockInvest.module.css';

const sideOptions = [
  { value: 'buy', label: '매수' },
  { value: 'sell', label: '매도' },
] as const;

const sideText = (side: MockOrderSide) => (side === 'buy' ? '매수' : '매도');

/** 주문할 기업. 검색에서 고르거나 보유 종목에서 바로 정해요 */
type Target = Pick<CompanySummary, 'stock_code' | 'name'> & { price?: number | null };

/** 현재가 아래 작은 주가 그래프 (최근 3달 일 캔들) */
function OrderChart({ stockCode }: { stockCode: string }) {
  const { data, isPending, isError } = usePriceHistory(stockCode, '3m', 'day');
  const points = data?.points ?? [];
  if (isPending) return <div className={styles.chartSkeleton} aria-hidden="true" />;
  if (isError || points.length === 0)
    return <p className={styles.chartEmpty}>주가 그래프를 불러오지 못했어요</p>;
  return (
    <div className={styles.orderChart}>
      <PriceChart
        points={points}
        height={150}
        interval={data?.interval ?? 'day'}
        previousClose={data?.previous_close}
      />
    </div>
  );
}

/** 서버가 거절한 이유 */
function orderErrorText(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'INSUFFICIENT_CASH' || error.code === 'INSUFFICIENT_BALANCE')
      return '가상 현금이 부족해서 매수하지 못했어요. 내 자산에서 앰똥깡을 환전해 주세요';
    if (error.code === 'INSUFFICIENT_QUANTITY') {
      const held = error.number('held');
      return held === undefined
        ? '가진 수량보다 많이 매도할 수 없어요'
        : `가진 수량(${held.toLocaleString('ko-KR')}주)보다 많이 매도할 수 없어요`;
    }
    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      const seconds = error.number('retry_after');
      return seconds === undefined
        ? '주문이 너무 잦아요. 잠시 후 다시 해 주세요. 가상 현금은 그대로예요'
        : `주문이 너무 잦아요. ${Math.ceil(seconds)}초 뒤에 다시 해 주세요. 가상 현금은 그대로예요`;
    }
  }
  return `주문하지 못했어요. ${errorReason(error)} 가상 현금은 그대로예요`;
}

/**
 * 주문: 기업 검색(또는 보유 종목에서 바로) → 매수·매도, 수량, 예상 금액 → 화면 안 확인 단계 → 체결 결과
 * 예상 금액은 화면의 지연 시세로 계산하고, 실제 체결 가격은 서버가 주문을 받은 때의 지연 시세로 정해요.
 */
export function MockOrderPanel({
  portfolio,
  request,
}: {
  portfolio: MockPortfolio;
  /** 보유 종목의 [매수]·[매도] 버튼으로 온 주문 요청. nonce 가 바뀔 때마다 새로 적용해요 */
  request?: OrderRequest | null;
}) {
  const [company, setCompany] = useState<Target | null>(null);
  const [side, setSide] = useState<MockOrderSide>('buy');
  const [quantityText, setQuantityText] = useState('1');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<MockTrade | null>(null);
  const order = useMockOrder();
  const detail = useCompany(company?.stock_code ?? '');
  const quantityId = useId();
  const panelRef = useRef<HTMLElement>(null);

  // 보유 종목에서 [매수]·[매도]를 누르면 그 종목·종류로 주문 칸을 바로 채워요 (렌더 중 상태 맞추기)
  const [appliedNonce, setAppliedNonce] = useState(request?.nonce);
  if (request && request.nonce !== appliedNonce) {
    setAppliedNonce(request.nonce);
    setCompany({ stock_code: request.stock_code, name: request.name, price: request.price });
    setSide(request.side);
    setQuantityText('1');
    setConfirming(false);
    setDone(null);
    order.reset();
  }
  useEffect(() => {
    if (request) panelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }, [request]);

  const price = detail.data?.current_price.value ?? company?.price ?? null;
  const priceAsOf = detail.data?.price_as_of ?? null;
  const quantity = Number(quantityText);
  const validQuantity =
    Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_ORDER_QUANTITY;
  const amount = price !== null && validQuantity ? price * quantity : null;
  const held = company
    ? (portfolio.holdings.find((h) => h.stock_code === company.stock_code)?.quantity ?? 0)
    : 0;
  const maxBuy = price ? Math.floor(portfolio.cash / price) : 0;
  const rate = detail.data?.change_rate.value ?? null;
  const tone = toneOf(rate);

  const changeQuantity = (step: number) => {
    const base = validQuantity ? quantity : 1;
    setQuantityText(String(Math.min(MAX_ORDER_QUANTITY, Math.max(1, base + step))));
    setConfirming(false);
  };
  const fillMax = (max: number) => {
    setQuantityText(String(Math.min(MAX_ORDER_QUANTITY, Math.max(1, max))));
    setConfirming(false);
  };

  const problem = !validQuantity
    ? `수량은 1~${MAX_ORDER_QUANTITY.toLocaleString('ko-KR')}주로 입력해 주세요`
    : side === 'buy' && amount !== null && amount > portfolio.cash
      ? '가상 현금이 부족해요. 내 자산에서 앰똥깡을 환전해 주세요'
      : side === 'sell' && quantity > held
        ? held === 0
          ? '가진 주식이 없어서 매도할 수 없어요'
          : `가진 수량(${held}주)보다 많이 매도할 수 없어요`
        : null;

  const choose = (next: CompanySummary) => {
    setCompany({
      stock_code: next.stock_code,
      name: next.name,
      price: next.current_price.value,
    });
    setConfirming(false);
    setDone(null);
    order.reset();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (problem || amount === null) return;
    setDone(null);
    order.reset();
    setConfirming(true);
  };

  const confirm = () => {
    if (!company) return;
    order.mutate(
      { stock_code: company.stock_code, side, quantity },
      {
        onSuccess: (result) => {
          setDone(result.trade);
          setConfirming(false);
          setQuantityText('1');
        },
        onError: () => setConfirming(false),
      },
    );
  };

  return (
    <section ref={panelRef} className={styles.panel} aria-labelledby="mock-order">
      <h2 id="mock-order" className={styles.panelTitle}>
        주문
      </h2>

      {!company ? (
        <div className={styles.orderSearch}>
          <CompanySearch variant="header" onSelect={choose} placeholder="매수·매도할 기업 검색" />
        </div>
      ) : (
        <form className={styles.orderForm} onSubmit={onSubmit} aria-label={`${company.name} 주문`}>
          <div className={styles.orderCompany}>
            <p className={styles.orderName}>{company.name}</p>
            <Button type="button" variant="ghost" onClick={() => setCompany(null)}>
              기업 바꾸기
            </Button>
          </div>

          <div className={styles.quote}>
            <span className={`${styles.quotePrice} ${styles[tone]}`}>
              {price !== null ? formatWon(price) : '불러오는 중'}
            </span>
            {rate !== null && rate !== undefined && (
              <span className={`${styles.quoteRate} ${styles[tone]}`}>
                {tone === 'rise' ? '▲' : tone === 'fall' ? '▼' : ''} {formatRate(rate)}
                <span className="visually-hidden"> {toneWords(rate)}</span>
              </span>
            )}
            {priceAsOf && (
              <span className={styles.meta}>
                <DataAsOf value={priceAsOf} suffix="지연 시세" />
              </span>
            )}
          </div>

          <OrderChart stockCode={company.stock_code} />

          <div className={styles.sideTabs} role="radiogroup" aria-label="주문 종류">
            {sideOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={side === option.value}
                className={[
                  styles.sideTab,
                  side === option.value
                    ? option.value === 'buy'
                      ? styles.sideTabBuy
                      : styles.sideTabSell
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setSide(option.value);
                  setConfirming(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {side === 'buy' && (
            <p className={styles.learnNote}>
              매수하기 전에 이 기업의 최근 실적을 확인해 보세요.{' '}
              <Link to={`/companies/${company.stock_code}?tab=financials`}>최근 실적 보기</Link>
              {' · '}
              <Link to={`/companies/${company.stock_code}?tab=analysis`}>AI 리포트 보기</Link>
            </p>
          )}

          <div className={styles.field}>
            <label htmlFor={quantityId} className={styles.fieldLabel}>
              수량
            </label>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepButton}
                aria-label="수량 줄이기"
                onClick={() => changeQuantity(-1)}
              >
                −
              </button>
              <input
                id={quantityId}
                className={styles.stepInput}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_ORDER_QUANTITY}
                step={1}
                value={quantityText}
                onChange={(e) => {
                  setQuantityText(e.target.value);
                  setConfirming(false);
                }}
              />
              <span className={styles.stepUnit}>주</span>
              <button
                type="button"
                className={styles.stepButton}
                aria-label="수량 늘리기"
                onClick={() => changeQuantity(1)}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>가격</span>
            <div className={styles.priceBox}>
              <span className={styles.meta}>시장가 (지연 시세)</span>
              <strong>{price !== null ? formatWon(price) : '-'}</strong>
            </div>
          </div>

          <div className={styles.available}>
            <span className={styles.meta}>
              {side === 'buy'
                ? `가상 현금 ${formatWon(portfolio.cash)} · 최대 ${maxBuy.toLocaleString('ko-KR')}주`
                : `가진 수량 ${held}주`}
            </span>
            <button
              type="button"
              className={styles.maxButton}
              disabled={(side === 'buy' ? maxBuy : held) < 1}
              onClick={() => fillMax(side === 'buy' ? maxBuy : held)}
            >
              {side === 'buy' ? '최대' : '전량'}
            </button>
          </div>

          <div className={styles.orderTotal}>
            <span>주문금액</span>
            <strong>{amount !== null ? formatWon(amount) : '-'}</strong>
          </div>
          {problem && (
            <p className={styles.problem} role="alert">
              {problem}
            </p>
          )}

          {confirming && amount !== null ? (
            <div className={styles.confirm} role="group" aria-label="주문 확인">
              <p className={styles.confirmTitle}>
                {company.name} {quantity.toLocaleString('ko-KR')}주를{' '}
                {side === 'buy' ? '매수할까요' : '매도할까요'}?
              </p>
              <p className={styles.meta}>
                예상 {formatWon(amount)} · 가상 현금{' '}
                {side === 'buy'
                  ? `${formatWon(portfolio.cash)} → ${formatWon(portfolio.cash - amount)}`
                  : `${formatWon(portfolio.cash)} → ${formatWon(portfolio.cash + amount)}`}
              </p>
              <p className={styles.meta}>{MOCK_PRICE_BASIS_TEXT}</p>
              <div className={styles.confirmActions}>
                <Button type="button" onClick={confirm} disabled={order.isPending}>
                  {order.isPending ? '주문하는 중…' : `${sideText(side)} 확정`}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirming(false)}
                  disabled={order.isPending}
                >
                  돌아가기
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className={`${styles.orderButton} ${side === 'buy' ? styles.orderBuy : styles.orderSell}`}
              disabled={Boolean(problem) || amount === null}
            >
              {sideText(side)} 주문
            </button>
          )}
        </form>
      )}

      {done && (
        <p className={styles.result} role="status">
          체결됐어요 · {done.name} {done.quantity.toLocaleString('ko-KR')}주 {sideText(done.side)} ·
          1주 {formatWon(done.price)} · {formatWon(done.amount)}
        </p>
      )}
      {order.isError && (
        <p className={styles.problem} role="alert">
          {orderErrorText(order.error)}
        </p>
      )}
    </section>
  );
}
