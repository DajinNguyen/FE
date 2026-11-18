import { DataAsOf } from '../../components/DataAsOf';
import { formatAdkDetail } from '../../config/currency';
import type { MockPortfolio } from '../../types';
import { formatRate, formatSignedWon, formatWon, toneOf, toneWords } from './mockInvestFormat';
import styles from './MockInvest.module.css';

/** 내 자산: 총 자산, 가상 현금(= 앰똥깡), 평가금액, 수익률 */
export function MockAssets({ portfolio }: { portfolio: MockPortfolio }) {
  const rate = portfolio.profit_rate;
  return (
    <section className={styles.panel} aria-labelledby="mock-assets">
      <h2 id="mock-assets" className={styles.panelTitle}>
        내 자산
      </h2>
      <p className={styles.total}>
        <span className={styles.totalLabel}>총 자산</span>
        {formatWon(portfolio.total_asset)}
      </p>
      <dl className={styles.assetGrid}>
        <div>
          <dt>가상 현금</dt>
          <dd>
            {formatWon(portfolio.cash)}
            <span className={styles.sub}>{formatAdkDetail(portfolio.cash_adk)}</span>
          </dd>
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
      <p className={styles.meta}>
        1 ADK = 가상 {formatWon(portfolio.adk_to_won)} ·{' '}
        <DataAsOf value={portfolio.price_as_of} suffix="지연 시세 기준" />
      </p>
    </section>
  );
}
