import { CompanyRow } from '../components/CompanyRow';
import { CompanySearch } from '../components/CompanySearch';
import { TodayTermCard } from '../features/term-cards/TodayTermCard';
import { usePopularCompanies } from '../hooks/useCompanies';
import { useOpenCompany } from '../hooks/useOpenCompany';
import styles from './HomePage.module.css';

const howItWorks = [
  { title: '회사 검색', description: '이름, 영어 이름, 종목코드 무엇이든 괜찮아요' },
  { title: '그래프로 먼저 보기', description: '주가 흐름과 재무제표를 한눈에 봐요' },
  { title: 'AI 리포트 작성', description: '재무제표·뉴스·사업보고서를 쉬운 말로 풀어 드려요' },
];

export function HomePage() {
  const popular = usePopularCompanies();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>궁금한 회사를 쉽게 알아봐요</h1>
        <p className={styles.subtitle}>
          어려운 재무제표와 뉴스를 AI가 쉬운 말로 풀어 드려요. 투자 추천이 아니라, 회사를 이해하는
          데 집중해요.
        </p>

        <div className={styles.searchBox}>
          <CompanySearch variant="hero" autoFocus />
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>많이 보는 회사</h2>
          <ul>
            {popular.data?.map((company, index) => (
              <CompanyRow
                key={company.stock_code}
                company={company}
                onSelect={openCompany}
                rank={index + 1}
              />
            ))}
          </ul>
        </section>

        <aside className={styles.aside}>
          <TodayTermCard />
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>다진은 이렇게 써요</h2>
            <ol className={styles.steps}>
              {howItWorks.map((step, index) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span>
                    <span className={styles.stepTitle}>{step.title}</span>
                    <span className={styles.stepDescription}>{step.description}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
