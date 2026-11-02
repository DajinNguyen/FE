import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router';
import { CompanySearch } from '../components/CompanySearch';
import { DataAsOf } from '../components/DataAsOf';
import { ErrorState } from '../components/ErrorState';
import { Icon } from '../components/Icon';
import { HOME_TRADING_LIMIT } from '../config/home';
import { CompanyListRow } from '../features/home/CompanyListRow';
import { TermGameBanner } from '../features/home/TermGameBanner';
import { HotIndustries } from '../features/industry/HotIndustries';
import { MarketReasons } from '../features/market/MarketReasons';
import { MarketToday } from '../features/market/MarketToday';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useOpenCompany } from '../hooks/useOpenCompany';
import listStyles from '../features/home/CompanyList.module.css';
import styles from './HomePage.module.css';

/**
 * 메인 화면 (가운데 정렬, 위에서 아래로)
 * 크게: 1. 시장 한마디(+ 지수 칩) 2. 기업 검색(좁은 화면만) 3. 관심이 몰리는 산업 TOP 3
 * 보통: 4. 오늘 시장이 왜 움직였나요?
 * 작게: 5. 거래 많은 기업 TOP 3 6. 용어 학습 진입
 */
export function HomePage() {
  const { data, isPending, isError, error, refetch } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <MarketToday />
        {/* 넓은 화면은 위쪽 메뉴(관심 기업 옆)에 검색창이 있어서, 좁은 화면에서만 보여줘요. */}
        <section className={styles.search} aria-label="기업 검색">
          <CompanySearch variant="hero" />
        </section>
      </div>

      <HotIndustries />

      <MarketReasons />

      <div className={styles.smallRow}>
        <section className={styles.small} aria-labelledby="home-trading">
          <div className={styles.smallHead}>
            <h2 id="home-trading" className={styles.smallTitle}>
              <BarChart3 size={18} strokeWidth={2} aria-hidden="true" />
              거래 많은 기업 TOP {HOME_TRADING_LIMIT}
            </h2>
            <Link to="/rankings/trading" className={styles.more}>
              전체 보기 <Icon name="chevronRight" size={16} />
            </Link>
          </div>
          {data && (
            <p className={styles.smallNote}>
              <DataAsOf value={data.base_time} suffix="기준 · 거래대금 순" />
            </p>
          )}
          {isPending && <div className={styles.loading} aria-hidden="true" />}
          {isError && (
            <ErrorState
              compact
              title="목록을 불러오지 못했어요"
              error={error}
              onRetry={() => refetch()}
            />
          )}
          {data && data.trading_value_top.length === 0 && (
            <p className={styles.hint}>아직 보여줄 기업이 없어요.</p>
          )}
          {data && data.trading_value_top.length > 0 && (
            <ol className={listStyles.list} aria-label="거래 많은 기업">
              {data.trading_value_top.slice(0, HOME_TRADING_LIMIT).map((company, index) => (
                <CompanyListRow
                  key={company.stock_code}
                  company={company}
                  rank={index + 1}
                  onSelect={openCompany}
                  compact
                />
              ))}
            </ol>
          )}
        </section>

        <TermGameBanner />
      </div>
    </div>
  );
}
