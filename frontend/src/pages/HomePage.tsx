import { Link } from 'react-router';
import { CompanySearch } from '../components/CompanySearch';
import { DataAsOf } from '../components/DataAsOf';
import { Icon } from '../components/Icon';
import { HOME_TRADING_LIMIT } from '../config/home';
import { CompanyListRow } from '../features/home/CompanyListRow';
import { TermGameBanner } from '../features/home/TermGameBanner';
import { HotIndustries } from '../features/industry/HotIndustries';
import { MarketToday } from '../features/market/MarketToday';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useOpenCompany } from '../hooks/useOpenCompany';
import listStyles from '../features/home/CompanyList.module.css';
import styles from './HomePage.module.css';

/**
 * 메인 화면 (위에서 아래로)
 * 1. 오늘의 시장: 한마디(페이지 제목) · 서비스 소개 한 줄 · 지수 · 왜 움직였나요?
 * 2. 기업 검색 (시장 정보가 없어도 항상 써요)
 * 3. 지금 관심이 몰리는 산업
 * 4. 거래 많은 기업 TOP 3 (작게)
 * 5. 용어 학습
 */
export function HomePage() {
  const { data, isError } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <MarketToday />

      <section className={styles.hero} aria-label="기업 검색">
        <CompanySearch variant="hero" />
      </section>

      <HotIndustries />

      <section className={styles.section} aria-labelledby="home-trading">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="home-trading" className={styles.sectionTitle}>
              거래 많은 기업 TOP {HOME_TRADING_LIMIT}
            </h2>
            {data && (
              <div className={styles.sectionNote}>
                <DataAsOf value={data.base_time} suffix="기준 · 거래대금 순" />
              </div>
            )}
          </div>
          <Link to="/rankings/trading" className={styles.more}>
            전체 보기 <Icon name="chevronRight" size={16} />
          </Link>
        </div>
        {isError && (
          <p className={styles.hint}>목록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>
        )}
        {data && (
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
  );
}
