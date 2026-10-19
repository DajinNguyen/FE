import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CompanySearch } from '../components/CompanySearch';
import { DataAsOf } from '../components/DataAsOf';
import { Icon } from '../components/Icon';
import { FEATURE_RISING_COMPANIES, HOME_TRADING_LIMIT, SEARCH_EXAMPLES } from '../config/home';
import { CompanyListRow } from '../features/home/CompanyListRow';
import { HowItWorks } from '../features/home/HowItWorks';
import { SectorCompanies } from '../features/home/SectorCompanies';
import { TermGameBanner } from '../features/home/TermGameBanner';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useOpenCompany } from '../hooks/useOpenCompany';
import listStyles from '../features/home/CompanyList.module.css';
import styles from './HomePage.module.css';

/**
 * 메인 화면 (위에서 아래로)
 * 1. 서비스 한 줄 설명 + 큰 검색창 + 검색 예시
 * 2. 다진이 하는 일 3단계
 * 3. 오늘 거래가 많은 기업 (순위 리스트)
 * 4. 업종별 기업
 * 5. 용어 게임 배너
 */
export function HomePage() {
  const { data, isPending, isError } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <h1 id="home-title" className={styles.title}>
          궁금한 기업을 검색하면, AI가 재무제표·뉴스·사업 방향을 근거로 쉽게 설명해 드려요
        </h1>
        <div className={styles.searchBox}>
          <CompanySearch variant="hero" autoFocus />
        </div>
        <div className={styles.examples}>
          <span className={styles.examplesLabel}>이렇게 찾아보세요</span>
          <ul className={styles.exampleList}>
            {SEARCH_EXAMPLES.map((example) => (
              <li key={example.stock_code}>
                <button
                  type="button"
                  className={styles.exampleChip}
                  onClick={() => openCompany(example)}
                >
                  {example.name}
                </button>
              </li>
            ))}
          </ul>
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
