import { useId, useState, type FormEvent } from 'react';
import { ApiError, errorReason } from '../../api/errors';
import { Button } from '../../components/Button';
import { DataAsOf } from '../../components/DataAsOf';
import { formatAdk, formatAdkDetail } from '../../config/currency';
import { useMockExchange } from '../../hooks/useMockInvest';
import type { MockExchange, MockPortfolio } from '../../types';
import { formatRate, formatSignedWon, formatWon, toneOf, toneWords } from './mockInvestFormat';
import styles from './MockInvest.module.css';

/** 환전을 거절한 이유 */
function exchangeErrorText(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'INSUFFICIENT_BALANCE') return '앰똥깡이 부족해서 환전하지 못했어요';
    if (error.code === 'INVALID_AMOUNT') return '환전할 앰똥깡은 1 ADK 단위로 정해 주세요';
    if (error.code === 'RATE_LIMITED' || error.status === 429)
      return '환전이 너무 잦아요. 잠시 후 다시 해 주세요';
  }
  return `환전하지 못했어요. ${errorReason(error)} 앰똥깡은 빠지지 않았어요`;
}

/**
 * 환전: 앰똥깡(정수) → 가상 현금. 화면 안 확인 단계를 거쳐요 (되돌릴 수 없어서).
 */
function ExchangeForm({ portfolio, onClose }: { portfolio: MockPortfolio; onClose: () => void }) {
  const [adkText, setAdkText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<MockExchange | null>(null);
  const exchange = useMockExchange();
  const inputId = useId();

  const maxAdk = Math.floor(portfolio.adk_balance + 1e-9);
  const adk = Number(adkText);
  const valid = adkText !== '' && Number.isInteger(adk) && adk >= 1;
  const problem =
    maxAdk < 1
      ? '환전할 앰똥깡이 없어요'
      : adkText === ''
        ? null
        : !valid
          ? '1 ADK 단위로 입력해 주세요'
          : adk > maxAdk
            ? `가진 앰똥깡(${formatAdk(maxAdk)})보다 많이 환전할 수 없어요`
            : null;
  const won = valid ? adk * portfolio.adk_to_won : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || problem) return;
    setDone(null);
    exchange.reset();
    setConfirming(true);
  };

  const confirm = () =>
    exchange.mutate(adk, {
      onSuccess: (result) => {
        setDone(result.exchange);
        setConfirming(false);
        setAdkText('');
      },
      onError: () => setConfirming(false),
    });

  return (
    <form className={styles.exchange} onSubmit={onSubmit} aria-label="앰똥깡 환전">
      <p className={styles.meta}>
        가진 앰똥깡 {formatAdkDetail(portfolio.adk_balance)} · 1 ADK = 가상{' '}
        {formatWon(portfolio.adk_to_won)}
      </p>
      <div className={styles.quantityRow}>
        <label htmlFor={inputId} className={styles.quantityLabel}>
          환전할 앰똥깡
        </label>
        <input
          id={inputId}
          className={styles.quantityInput}
          type="number"
          inputMode="numeric"
          min={1}
          max={maxAdk}
          step={1}
          placeholder="ADK"
          value={adkText}
          onChange={(e) => {
            setAdkText(e.target.value);
            setConfirming(false);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={maxAdk < 1}
          onClick={() => {
            setAdkText(String(maxAdk));
            setConfirming(false);
          }}
        >
          전부
        </Button>
      </div>
      <p className={styles.estimate}>
        받는 가상 현금 <strong>{won !== null && !problem ? formatWon(won) : '-'}</strong>
      </p>
      {problem && (
        <p className={styles.problem} role="alert">
          {problem}
        </p>
      )}

      {confirming && won !== null ? (
        <div className={styles.confirm} role="group" aria-label="환전 확인">
          <p className={styles.confirmTitle}>
            {formatAdk(adk)}를 가상 {formatWon(won)}으로 환전할까요?
          </p>
          <p className={styles.meta}>
            환전한 앰똥깡은 AI 리포트·챗봇에 쓸 수 없고, 다시 앰똥깡으로 바꿀 수 없어요
          </p>
          <div className={styles.confirmActions}>
            <Button type="button" onClick={confirm} disabled={exchange.isPending}>
              {exchange.isPending ? '환전하는 중…' : '환전 확정'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirming(false)}
              disabled={exchange.isPending}
            >
              돌아가기
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.confirmActions}>
          <Button type="submit" disabled={!valid || Boolean(problem)}>
            환전 확인
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      )}

      {done && (
        <p className={styles.result} role="status">
          환전했어요 · {formatAdk(done.adk)} → 가상 {formatWon(done.won)}
        </p>
      )}
      {exchange.isError && (
        <p className={styles.problem} role="alert">
          {exchangeErrorText(exchange.error)}
        </p>
      )}
    </form>
  );
}

/** 내 자산: 총 자산, 가상 현금(환전한 돈), 평가금액, 수익률, 환전하기 */
export function MockAssets({ portfolio }: { portfolio: MockPortfolio }) {
  const rate = portfolio.profit_rate;
  const [exchanging, setExchanging] = useState(false);
  return (
    <section className={styles.panel} aria-labelledby="mock-assets">
      <div className={styles.panelHead}>
        <h2 id="mock-assets" className={styles.panelTitle}>
          내 자산
        </h2>
        {!exchanging && (
          <Button type="button" variant="secondary" onClick={() => setExchanging(true)}>
            환전하기
          </Button>
        )}
      </div>
      <p className={styles.total}>
        <span className={styles.totalLabel}>총 자산</span>
        {formatWon(portfolio.total_asset)}
      </p>
      <dl className={styles.assetGrid}>
        <div>
          <dt>가상 현금</dt>
          <dd>{formatWon(portfolio.cash)}</dd>
        </div>
        <div>
          <dt>평가금액</dt>
          <dd>{formatWon(portfolio.evaluation)}</dd>
        </div>
        <div>
          <dt>수익률</dt>
          <dd className={styles[toneOf(rate)]}>
            {rate === null ? '-' : formatRate(rate)}
            {rate !== null && <span className="visually-hidden"> {toneWords(rate)}</span>}
            {rate !== null && (
              <span className={styles.sub}>{formatSignedWon(portfolio.profit)}</span>
            )}
          </dd>
        </div>
      </dl>

      {exchanging ? (
        <ExchangeForm portfolio={portfolio} onClose={() => setExchanging(false)} />
      ) : (
        portfolio.cash === 0 &&
        portfolio.holdings.length === 0 && (
          <p className={styles.learnNote}>
            앰똥깡을 가상 현금으로 환전하면 그 돈으로 모의투자를 시작할 수 있어요
          </p>
        )
      )}

      <p className={styles.meta}>
        1 ADK = 가상 {formatWon(portfolio.adk_to_won)}
        {/* 보유 종목이 없으면 시세 기준 시각이 없어요 (null) */}
        {portfolio.price_as_of && (
          <>
            {' · '}
            <DataAsOf value={portfolio.price_as_of} suffix="지연 시세 기준" />
          </>
        )}
      </p>
    </section>
  );
}
