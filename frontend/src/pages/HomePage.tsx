import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CompanySearch } from '../components/CompanySearch';
import { DataAsOf } from '../components/DataAsOf';
import { Icon } from '../components/Icon';
import { FEATURE_RISING_COMPANIES, HOME_TRADING_LIMIT } from '../config/home';
import { CompanyListRow } from '../features/home/CompanyListRow';
import { MarketToday } from '../features/market/MarketToday';
import { HowItWorks } from '../features/home/HowItWorks';
import { SectorCompanies } from '../features/home/SectorCompanies';
import { TermGameBanner } from '../features/home/TermGameBanner';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useOpenCompany } from '../hooks/useOpenCompany';
import listStyles from '../features/home/CompanyList.module.css';
import styles from './HomePage.module.css';

/**
 * 메인 화면 (위에서 아래로)
 * 1. 오늘의 시장: 한마디(페이지 제목) + 지수
 * 2. 큰 검색창
 * 3. 다진이 하는 일 3단계
 * 4. 오늘 거래가 많은 기업 (순위 리스트)
 * 5. 업종별 기업
 * 6. 용어 게임 배너
 */
export function HomePage() {
  const { data, isPending, isError } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <MarketToday />

      <section className={styles.hero} aria-label="기업 검색">
        <div className={styles.searchBox}>
          <CompanySearch variant="hero" />
        </div>
      </section>

      <HowItWorks />

      {isError && (
        <p className={styles.hint}>목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
      {isPending && <div className={styles.loading} aria-hidden="true" />}

      {data && (
        <>
          <HomeSection
            title="오늘 거래가 많은 기업"
            note={<DataAsOf value={data.base_time} suffix="기준 · 거래대금 순" />}
            action={
              <Link to="/rankings/trading" className={styles.more}>
                전체 보기 <Icon name="chevronRight" size={16} />
              </Link>
            }
          >
            <ol className={listStyles.list}>
              {data.trading_value_top.slice(0, HOME_TRADING_LIMIT).map((company, index) => (
                <CompanyListRow
                  key={company.stock_code}
                  company={company}
                  rank={index + 1}
                  onSelect={openCompany}
                />
              ))}
            </ol>
          </HomeSection>

          {FEATURE_RISING_COMPANIES && (
            <HomeSection title="떠오르는 기업" note={data.rising.criteria}>
              <ul className={listStyles.list}>
                {data.rising.items.map((company) => (
                  <CompanyListRow
                    key={company.stock_code}
                    company={company}
                    onSelect={openCompany}
                  />
                ))}
              </ul>
            </HomeSection>
          )}

          <HomeSection title="업종별 기업">
            <SectorCompanies companies={data.sector_companies} onSelect={openCompany} />
          </HomeSection>
        </>
      )}

      <TermGameBanner />
    </div>
  );
}

function HomeSection({
  title,
  note,
  action,
  children,
}: {
  title: string;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {note && <div className={styles.sectionNote}>{note}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
