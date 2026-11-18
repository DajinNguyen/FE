import { Link } from 'react-router';
import type { MockHolding } from '../../types';
import { formatRate, formatWon, toneOf, toneWords } from './mockInvestFormat';
import styles from './MockInvest.module.css';

/** 보유 종목: 종목명(→ 기업 개요), 수량, 평균 가격, 현재 가격, 수익률, [AI 리포트 보기] */
export function MockHoldings({ holdings }: { holdings: MockHolding[] }) {
  return (
    <section className={styles.panel} aria-labelledby="mock-holdings">
      <h2 id="mock-holdings" className={styles.panelTitle}>
        보유 종목 <span className={styles.count}>{holdings.length}개</span>
      </h2>
      {holdings.length === 0 ? (
        <p className={styles.empty}>
          아직 가진 종목이 없어요. 주문에서 기업을 찾아 사고팔기를 연습할 수 있어요.
        </p>
      ) : (
        <ul className={styles.rows} aria-label="보유 종목">
          {holdings.map((h) => (
            <li key={h.stock_code} className={styles.holding}>
              <div className={styles.holdingHead}>
                <Link to={`/companies/${h.stock_code}`} className={styles.holdingName}>
                  {h.name}
                </Link>
                <span className={`${styles.holdingRate} ${styles[toneOf(h.profit_rate)]}`}>
                  {formatRate(h.profit_rate)}
                  <span className="visually-hidden"> {toneWords(h.profit_rate)}</span>
                </span>
              </div>
              <dl className={styles.holdingStats}>
                <div>
                  <dt>수량</dt>
                  <dd>{h.quantity.toLocaleString('ko-KR')}주</dd>
                </div>
                <div>
                  <dt>평균 가격</dt>
                  <dd>{formatWon(h.avg_price)}</dd>
                </div>
                <div>
                  <dt>현재 가격</dt>
                  <dd>{formatWon(h.current_price)}</dd>
                </div>
              </dl>
              <Link to={`/companies/${h.stock_code}?tab=analysis`} className={styles.reportLink}>
                AI 리포트 보기
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
