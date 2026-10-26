import { CompanySearch } from '../components/CompanySearch';
import { CompanyBrowse } from '../features/home/CompanyBrowse';
import { TermLearningBanner } from '../features/home/TermLearningBanner';
import { MarketToday } from '../features/market/MarketToday';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useOpenCompany } from '../hooks/useOpenCompany';
import styles from './HomePage.module.css';

/**
 * 메인 화면 (위에서 아래로) — 숫자보다 "왜"가 먼저 보이게
 * 1. 오늘의 시장: 한마디(페이지 제목) → 지수 → 왜 움직였나요?
 * 2. 기업 검색창
 * 3. 기업 둘러보기: 업종별 기업 / 거래 많은 기업 (작게, 5개씩)
 * 4. 용어 학습 진입
 */
export function HomePage() {
  const { data, isPending, isError } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <MarketToday />

      <section className={styles.search} aria-label="기업 검색">
        <CompanySearch variant="hero" />
      </section>

      {isError && (
        <p className={styles.hint}>기업 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
      {isPending && <div className={styles.loading} aria-hidden="true" />}
      {data && <CompanyBrowse data={data} onSelect={openCompany} />}

      <TermLearningBanner />
    </div>
  );
}
