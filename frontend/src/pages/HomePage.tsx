import type { ReactNode } from 'react';
import { AdSlot } from '../components/AdSlot';
import { CompanyAvatar } from '../components/CompanyAvatar';
import { CompanySearch } from '../components/CompanySearch';
import { Icon } from '../components/Icon';
import { PriceChange } from '../components/PriceChange';
import { SampleBadge } from '../components/SampleBadge';
import { TodayTermCard } from '../features/term-cards/TodayTermCard';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useOpenCompany } from '../hooks/useOpenCompany';
import type { CompanySummary, TradingCompany } from '../types';
import styles from './HomePage.module.css';

/** 거래대금(억 원) → "2.1조 원" / "9,820억 원" */
const formatTradingValue = (eok: number) =>
  eok >= 10_000
    ? `${(eok / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조 원`
    : `${eok.toLocaleString('ko-KR')}억 원`;

export function HomePage() {
  const { data, isPending, isError } = useHomeDashboard();
  const openCompany = useOpenCompany();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>궁금한 기업을 검색하면 AI가 쉽게 분석해 드려요</h1>
        <p className={styles.subtitle}>
          어떤 회사인지, 지금 어떤 상황인지, 왜 그런 결과가 나왔는지 쉬운 말로 알려 드려요.
        </p>
        <div className={styles.searchBox}>
          <CompanySearch variant="hero" autoFocus />
        </div>
      </section>

      {isError && (
        <p className={styles.hint}>목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
      {isPending && <div className={styles.loading} aria-hidden="true" />}

      {data && (
        <div className={styles.sections}>
          <HomeSection
            title="오늘 거래가 많은 기업"
            note={`거래대금 기준 · ${data.base_time} 기준`}
          >
            {data.trading_value_top.map((company, index) => (
              <CompanyCard
                key={company.stock_code}
                company={company}
                rank={index + 1}
                onSelect={openCompany}
                extra={<TradingValue company={company} />}
              />
            ))}
          </HomeSection>

          <HomeSection title="떠오르는 기업" note={data.rising.criteria}>
            {data.rising.items.map((company) => (
              <CompanyCard key={company.stock_code} company={company} onSelect={openCompany} />
            ))}
          </HomeSection>

          <AdSlot placement="home-between-sections" />

          <HomeSection title="관심도 높은 기업" note={data.most_viewed.criteria}>
            {data.most_viewed.items.map((company, index) => (
              <CompanyCard
                key={company.stock_code}
                company={company}
                rank={index + 1}
                onSelect={openCompany}
              />
            ))}
          </HomeSection>

          <HomeSection title="AI가 분석한 기업" note="AI 핵심 분석의 한 줄 결론이에요">
            {data.ai_analyzed.length === 0 ? (
              <p className={styles.emptyRail}>아직 분석한 기업이 없어요</p>
            ) : (
              data.ai_analyzed.map((item) => (
                <button
                  key={item.stock_code}
                  type="button"
                  className={`${styles.card} ${styles.aiCard}`}
                  onClick={() => openCompany(item)}
                >
                  <span className={styles.aiEyebrow}>
                    <Icon name="sparkle" size={14} /> {item.name}
                  </span>
                  <span className={styles.aiHeadline}>{item.headline}</span>
                  <span className={styles.cardMore}>
                    분석 보기 <Icon name="chevronRight" size={14} />
                  </span>
                </button>
              ))
            )}
          </HomeSection>

          <section className={styles.termSection} aria-label="오늘의 용어">
            <TodayTermCard />
          </section>
        </div>
      )}
    </div>
  );
}

function HomeSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {note && <p className={styles.sectionNote}>{note}</p>}
      </div>
      {/* 가로로 밀어서 더 볼 수 있어요. */}
      <div className={styles.rail}>{children}</div>
    </section>
  );
}

function CompanyCard({
  company,
  rank,
  onSelect,
  extra,
}: {
  company: CompanySummary;
  rank?: number;
  onSelect: (company: CompanySummary) => void;
  extra?: ReactNode;
}) {
  return (
    <button type="button" className={styles.card} onClick={() => onSelect(company)}>
      <span className={styles.cardTop}>
        {rank !== undefined && <span className={styles.rank}>{rank}</span>}
        <CompanyAvatar name={company.name} code={company.stock_code} size={32} />
        <span className={styles.cardName}>{company.name}</span>
        {company.market_alert && (
          <span className={styles.alert} title={company.market_alert}>
            주의
          </span>
        )}
      </span>
      <span className={styles.oneLiner}>{company.one_liner}</span>
      <span className={styles.cardBottom}>
        {extra}
        <span className={styles.rate}>
          <PriceChange rate={company.change_rate.value} />
          <SampleBadge isSample={company.change_rate.is_sample} />
        </span>
      </span>
    </button>
  );
}

function TradingValue({ company }: { company: TradingCompany }) {
  return (
    <span className={styles.tradingValue}>
      거래대금 <strong>{formatTradingValue(company.trading_value.value)}</strong>
    </span>
  );
}
