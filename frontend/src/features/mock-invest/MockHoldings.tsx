import { Link } from 'react-router';
import { Button } from '../../components/Button';
import type { MockHolding, MockOrderSide } from '../../types';
import { formatRate, formatWon, toneOf, toneWords } from './mockInvestFormat';
import styles from './MockInvest.module.css';

/**
 * 보유 종목: 종목명(→ 기업 개요), 수량, 평균 가격, 현재 가격, 수익률, [매수] [매도] [AI 리포트 보기]
 * [매수]·[매도]를 누르면 검색 없이 그 종목으로 주문 칸이 채워져요.
 */
export function MockHoldings({
  holdings,
  onTrade,
}: {
  holdings: MockHolding[];
  onTrade: (holding: MockHolding, side: MockOrderSide) => void;
}) {
  return (
    <section className={styles.panel} aria-labelledby="mock-holdings">
      <h2 id="mock-holdings" className={styles.panelTitle}>
        보유 종목 <span className={styles.count}>{holdings.length}개</span>
      </h2>
      {holdings.length === 0 ? (
        <p className={styles.empty}>
          아직 가진 종목이 없어요. 주문에서 기업을 찾아 매수·매도를 연습할 수 있어요.
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
              <div className={styles.holdingActions}>
                <Button
                  variant="secondary"
                  onClick={() => onTrade(h, 'buy')}
                  aria-label={`${h.name} 매수`}
                >
                  매수
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onTrade(h, 'sell')}
                  aria-label={`${h.name} 매도`}
                >
                  매도
                </Button>
                <Link to={`/companies/${h.stock_code}?tab=analysis`} className={styles.reportLink}>
                  AI 리포트 보기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
