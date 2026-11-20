import { ErrorState } from '../../components/ErrorState';
import { useMockTrades } from '../../hooks/useMockInvest';
import { formatWon } from './mockInvestFormat';
import styles from './MockInvest.module.css';

const dateText = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 거래 내역: 날짜, 종목, 매수/매도, 수량, 가격 (최신 순) */
export function MockTrades() {
  const { data, isPending, isError, error, refetch } = useMockTrades();
  return (
    <section className={styles.panel} aria-labelledby="mock-trades">
      <h2 id="mock-trades" className={styles.panelTitle}>
        거래 내역
      </h2>
      {isPending ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : isError ? (
        <ErrorState compact error={error} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <p className={styles.empty}>아직 거래가 없어요.</p>
      ) : (
        <table className={styles.table}>
          <caption className="visually-hidden">모의투자 거래 내역</caption>
          <thead>
            <tr>
              <th scope="col">날짜</th>
              <th scope="col">종목</th>
              <th scope="col">구분</th>
              <th scope="col">수량</th>
              <th scope="col">가격</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <td>{dateText(t.created_at)}</td>
                <td>{t.name}</td>
                <td>
                  <span className={t.side === 'buy' ? styles.buyTag : styles.sellTag}>
                    {t.side === 'buy' ? '매수' : '매도'}
                  </span>
                </td>
                <td>{t.quantity.toLocaleString('ko-KR')}주</td>
                <td>{formatWon(t.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
