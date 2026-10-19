import { CompanyListRow } from '../features/home/CompanyListRow';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useOpenCompany } from '../hooks/useOpenCompany';
import { formatMarketDate } from '../utils/format';
import listStyles from '../features/home/CompanyList.module.css';
import styles from './TradingRankingPage.module.css';

/** 오늘 거래가 많은 기업 전체 순위 (메인 리스트와 같은 줄 디자인) */
export function TradingRankingPage() {
  const { data, isPending, isError } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>오늘 거래가 많은 기업</h1>
        {data && (
          <p className={styles.note}>
            {formatMarketDate(data.base_time)} 기준 · 거래대금 순 · 상위{' '}
            {data.trading_value_top.length}개
          </p>
        )}
      </header>

      {isError && (
        <p className={styles.hint}>목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
      {isPending && <div className={styles.loading} aria-hidden="true" />}

      {data && (
        <ol className={listStyles.list} aria-label="거래대금 순위">
          {data.trading_value_top.map((company, index) => (
            <CompanyListRow
              key={company.stock_code}
              company={company}
              rank={index + 1}
              onSelect={openCompany}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
