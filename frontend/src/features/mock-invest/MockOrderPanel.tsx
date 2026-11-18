import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError, errorReason } from '../../api/errors';
import { Button } from '../../components/Button';
import { CompanySearch } from '../../components/CompanySearch';
import { DataAsOf } from '../../components/DataAsOf';
import { SegmentedControl } from '../../components/SegmentedControl';
import { formatAdkDetail } from '../../config/currency';
import { MAX_ORDER_QUANTITY, MOCK_PRICE_BASIS_TEXT, wonToAdk } from '../../config/mockInvest';
import { useCompany } from '../../hooks/useCompanies';
import { useMockOrder } from '../../hooks/useMockInvest';
import type { CompanySummary, MockOrderSide, MockPortfolio, MockTrade } from '../../types';
import { formatWon } from './mockInvestFormat';
import styles from './MockInvest.module.css';

const sideOptions = [
  { value: 'buy', label: '사기' },
  { value: 'sell', label: '팔기' },
] as const;

const sideText = (side: MockOrderSide) => (side === 'buy' ? '사기' : '팔기');

/** 서버가 거절한 이유 */
function orderErrorText(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'INSUFFICIENT_BALANCE') return '가상 현금(앰똥깡)이 부족해서 사지 못했어요';
    if (error.code === 'INSUFFICIENT_QUANTITY') return '가진 수량보다 많이 팔 수 없어요';
  }
  return `주문하지 못했어요. ${errorReason(error)} 앰똥깡은 빠지지 않았어요`;
}

/**
 * 주문: 기업 검색 → 사기·팔기, 수량, 예상 금액 → 화면 안 확인 단계 → 체결 결과
 * 예상 금액은 화면의 지연 시세로 계산하고, 실제 체결 가격은 서버가 주문을 받은 때의 지연 시세로 정해요.
 */
export function MockOrderPanel({ portfolio }: { portfolio: MockPortfolio }) {
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [side, setSide] = useState<MockOrderSide>('buy');
  const [quantityText, setQuantityText] = useState('1');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<MockTrade | null>(null);
  const order = useMockOrder();
  const detail = useCompany(company?.stock_code ?? '');
  const quantityId = useId();

  const price = detail.data?.current_price.value ?? company?.current_price.value ?? null;
  const priceAsOf = detail.data?.price_as_of ?? null;
  const quantity = Number(quantityText);
  const validQuantity =
    Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_ORDER_QUANTITY;
  const amount = price !== null && validQuantity ? price * quantity : null;
  const held = company
    ? (portfolio.holdings.find((h) => h.stock_code === company.stock_code)?.quantity ?? 0)
    : 0;
  const maxBuy = price ? Math.floor(portfolio.cash / price) : 0;

  const problem = !validQuantity
    ? `수량은 1~${MAX_ORDER_QUANTITY.toLocaleString('ko-KR')}주로 입력해 주세요`
    : side === 'buy' && amount !== null && amount > portfolio.cash
      ? '가상 현금(앰똥깡)이 부족해요'
      : side === 'sell' && quantity > held
        ? held === 0
          ? '가진 주식이 없어서 팔 수 없어요'
          : `가진 수량(${held}주)보다 많이 팔 수 없어요`
        : null;

  const choose = (next: CompanySummary) => {
    setCompany(next);
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
    <section className={styles.panel} aria-labelledby="mock-order">
      <h2 id="mock-order" className={styles.panelTitle}>
        주문
      </h2>

      {!company ? (
        <div className={styles.orderSearch}>
          <CompanySearch variant="header" onSelect={choose} placeholder="사고팔 기업 검색" />
        </div>
      ) : (
        <form className={styles.orderForm} onSubmit={onSubmit} aria-label={`${company.name} 주문`}>
          <div className={styles.orderCompany}>
            <div>
              <p className={styles.orderName}>{company.name}</p>
              <p className={styles.meta}>
                {price !== null ? `지금 ${formatWon(price)}` : '가격 불러오는 중'}
                {priceAsOf && (
                  <>
                    {' · '}
                    <DataAsOf value={priceAsOf} suffix="지연 시세" />
                  </>
                )}
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={() => setCompany(null)}>
              기업 바꾸기
            </Button>
          </div>

          <SegmentedControl
            label="주문 종류"
            options={sideOptions}
            value={side}
            onChange={(next) => {
              setSide(next);
              setConfirming(false);
            }}
          />

          {side === 'buy' && (
            <p className={styles.learnNote}>
              사기 전에 이 기업의 최근 실적을 확인해 보세요.{' '}
              <Link to={`/companies/${company.stock_code}?tab=financials`}>최근 실적 보기</Link>
              {' · '}
              <Link to={`/companies/${company.stock_code}?tab=analysis`}>AI 리포트 보기</Link>
            </p>
          )}

          <div className={styles.quantityRow}>
            <label htmlFor={quantityId} className={styles.quantityLabel}>
              수량
            </label>
            <input
              id={quantityId}
              className={styles.quantityInput}
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
            <span className={styles.meta}>
              {side === 'buy' ? `최대 ${maxBuy.toLocaleString('ko-KR')}주` : `가진 수량 ${held}주`}
            </span>
          </div>

          <p className={styles.estimate}>
            예상 금액{' '}
            <strong>
              {amount !== null
                ? `${formatWon(amount)} (${formatAdkDetail(wonToAdk(amount))})`
                : '-'}
            </strong>
          </p>
          {problem && (
            <p className={styles.problem} role="alert">
              {problem}
            </p>
          )}

          {confirming && amount !== null ? (
            <div className={styles.confirm} role="group" aria-label="주문 확인">
              <p className={styles.confirmTitle}>
                {company.name} {quantity.toLocaleString('ko-KR')}주를{' '}
                {side === 'buy' ? '살까요' : '팔까요'}?
              </p>
              <p className={styles.meta}>
                예상 {formatWon(amount)} · {side === 'buy' ? '앰똥깡' : '돌아오는 앰똥깡'}{' '}
                {formatAdkDetail(wonToAdk(amount))}
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
            <Button type="submit" disabled={Boolean(problem) || amount === null}>
              주문 확인
            </Button>
          )}
        </form>
      )}

      {done && (
        <p className={styles.result} role="status">
          체결됐어요 · {done.name} {done.quantity.toLocaleString('ko-KR')}주 {sideText(done.side)} ·
          1주 {formatWon(done.price)} · {formatWon(done.amount)} ({formatAdkDetail(done.amount_adk)}
          )
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
