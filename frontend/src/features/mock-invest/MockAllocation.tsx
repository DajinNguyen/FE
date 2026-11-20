import { Link } from 'react-router';
import type { MockPortfolio } from '../../types';
import { formatWon } from './mockInvestFormat';
import styles from './MockInvest.module.css';

/** 한 종목이 이 비율 이상이면 몰려 있다고 알려줘요 (%) */
const CONCENTRATED = 50;

interface Slice {
  key: string;
  label: string;
  value: number;
  percent: number;
  to?: string;
}

const percentText = (percent: number) =>
  percent > 0 && percent < 0.1 ? '0.1% 미만' : `${percent.toFixed(1).replace(/\.0$/, '')}%`;

/** 내 자산 비중: 가상 현금과 보유 종목이 총 자산에서 차지하는 비율 (막대 한 줄 + 목록) */
export function MockAllocation({ portfolio }: { portfolio: MockPortfolio }) {
  const total = portfolio.total_asset;
  if (total <= 0) return null;

  const stocks: Slice[] = [...portfolio.holdings]
    .sort((a, b) => b.evaluation - a.evaluation)
    .map((h) => ({
      key: h.stock_code,
      label: h.name,
      value: h.evaluation,
      percent: (h.evaluation / total) * 100,
      to: `/companies/${h.stock_code}`,
    }));
  const slices: Slice[] = [
    ...stocks,
    {
      key: 'cash',
      label: '가상 현금',
      value: portfolio.cash,
      percent: (portfolio.cash / total) * 100,
    },
  ].filter((s) => s.value > 0);
  const top = stocks[0];
  const summary = slices.map((s) => `${s.label} ${percentText(s.percent)}`).join(', ');

  return (
    <section className={styles.panel} aria-labelledby="mock-allocation">
      <h2 id="mock-allocation" className={styles.panelTitle}>
        내 자산 비중
      </h2>
      <div className={styles.allocBar} role="img" aria-label={`자산 비중: ${summary}`}>
        {slices.map((s, i) => (
          <span
            key={s.key}
            className={s.key === 'cash' ? styles.allocCash : styles.allocSlice}
            style={{ flexGrow: s.value, ['--shade' as string]: `${Math.max(30, 100 - i * 20)}%` }}
          />
        ))}
      </div>
      <ul className={styles.allocList} aria-label="자산 비중 목록">
        {slices.map((s, i) => (
          <li key={s.key} className={styles.allocRow}>
            <span
              className={`${styles.allocDot} ${s.key === 'cash' ? styles.allocCash : styles.allocSlice}`}
              style={{ ['--shade' as string]: `${Math.max(30, 100 - i * 20)}%` }}
              aria-hidden="true"
            />
            {s.to ? (
              <Link to={s.to} className={styles.allocName}>
                {s.label}
              </Link>
            ) : (
              <span className={styles.allocName}>{s.label}</span>
            )}
            <span className={styles.allocValue}>{formatWon(s.value)}</span>
            <strong className={styles.allocPercent}>{percentText(s.percent)}</strong>
          </li>
        ))}
      </ul>
      {top && top.percent >= CONCENTRATED && (
        <p className={styles.learnNote}>
          {top.label}에 자산의 {percentText(top.percent)}가 몰려 있어요. 한 종목에 몰려 있으면 그
          종목이 떨어질 때 내 자산도 크게 흔들려요.
        </p>
      )}
    </section>
  );
}
