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
 * 1. 오늘의 시장: 한마디(페이지 제목) · 지수 · 왜 움직였나요?
 * 2. 기업 검색 (넓은 화면은 위쪽 메뉴에, 좁은 화면은 여기에)
 * 3. 지금 관심이 몰리는 산업
 * 4. 거래 많은 기업 TOP 3 (작게)
 * 5. 용어 학습
 * 오른쪽 사이드바: 다진 사용 방법 (좁은 화면은 맨 아래)
 */
export function HomePage() {
  const { data, isError } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.layout}>
      <div className={styles.page}>
        <MarketToday />

        {/* 넓은 화면은 위쪽 메뉴(관심 기업 옆)에 검색창이 있어서, 좁은 화면에서만 보여줘요. */}
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

      <aside className={styles.aside} aria-labelledby="home-howto">
        <h2 id="home-howto" className={styles.asideTitle}>
          다진 사용 방법
        </h2>
        <p className={styles.asideText}>
          기업을 검색하면 AI가 재무제표·뉴스를 근거로 쉽게 설명해요
        </p>
      </aside>
    </div>
  );
}
