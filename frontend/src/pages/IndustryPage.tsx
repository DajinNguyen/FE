import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '../components/Button';
import { DataAsOf } from '../components/DataAsOf';
import { EmptyState } from '../components/EmptyState';
import { SampleBadge } from '../components/SampleBadge';
import { TrendChart } from '../components/TrendChart';
import {
  HEAT_CRITERIA_TEXT,
  HEAT_DISCLAIMER,
  HEAT_FACTOR_LABELS,
  HEAT_FACTORS,
  HEAT_PERIODS,
  HEAT_WEIGHTS,
} from '../config/industryHeat';
import { industryIcon } from '../config/industryIcons';
import { changeDirection, signedPercent } from '../features/industry/industryText';
import { NewsList } from '../features/news/NewsList';
import { useIndustry } from '../hooks/useIndustries';
import { useIndustryNews } from '../hooks/useNews';
import type { IndustryDetail } from '../types';
import { formatTrillion } from '../utils/format';
import styles from './IndustryPage.module.css';

/** 관련 기업은 10개씩 보여줘요 */
const COMPANY_PAGE = 10;

/** "약 760조 원" / 1조 원 아래는 "약 0.8조 원" */
const aboutCap = (value: number) =>
  `약 ${formatTrillion(value, { min: 0, max: value < 10 ? 1 : 0 })}`;

function ScoreTable({ detail }: { detail: IndustryDetail }) {
  const breakdown = detail.score_breakdown;
  const periodLabel = HEAT_PERIODS.find((p) => p.id === breakdown.period)?.label ?? '';
  const total = HEAT_FACTORS.reduce((sum, key) => sum + breakdown[key] * HEAT_WEIGHTS[key], 0);
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>관심도 점수 구성 ({periodLabel} 기준)</caption>
        <thead>
          <tr>
            <th scope="col">항목</th>
            <th scope="col">변화</th>
            <th scope="col">비중</th>
            <th scope="col">반영 점수</th>
          </tr>
        </thead>
        <tbody>
          {HEAT_FACTORS.map((key) => (
            <tr key={key}>
              <th scope="row">{HEAT_FACTOR_LABELS[key]}</th>
              <td className={styles[changeDirection(breakdown[key])]}>
                {signedPercent(breakdown[key])}
              </td>
              <td>{Math.round(HEAT_WEIGHTS[key] * 100)}%</td>
              <td>{(breakdown[key] * HEAT_WEIGHTS[key]).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              점수
            </th>
            <td>{total.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** 산업 페이지: 왜 관심이 몰리는지 → 숫자 → 관련 뉴스 → 관련 기업(시가총액 큰 순) */
export function IndustryPage() {
  const { industryId = '' } = useParams();
  const { data: detail, isPending, isError } = useIndustry(industryId);
  const news = useIndustryNews(industryId);
  const [companyCount, setCompanyCount] = useState(COMPANY_PAGE);

  if (isPending) return <div className={styles.page} aria-busy="true" />;
  if (isError || !detail) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="산업 정보를 찾지 못했어요"
          description="주소가 바뀌었거나 아직 정리하지 않은 산업이에요."
          action={
            <Link to="/" className={styles.homeLink}>
              메인으로 가기
            </Link>
          }
        />
      </div>
    );
  }

  const Icon = industryIcon(detail.icon_key);
  const whyNews = detail.news.filter((item) => detail.why.news_ids.includes(item.id));
  const companies = [...detail.companies].sort((a, b) => b.market_cap - a.market_cap);
  const last = detail.trend.at(-1);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon size={32} strokeWidth={1.75} />
        </span>
        <div className={styles.headText}>
          <h1 className={styles.title}>{detail.name}</h1>
          <p className={styles.description}>{detail.description}</p>
          <p className={styles.asOf}>
            <DataAsOf value={detail.as_of} /> <SampleBadge isSample={detail.is_sample} />
          </p>
        </div>
      </header>

      {detail.why.text && (
        <section className={styles.section} aria-labelledby="industry-why">
          <h2 id="industry-why" className={styles.sectionTitle}>
            왜 관심이 몰리고 있나요?
          </h2>
          <p className={styles.why}>{detail.why.text}</p>
          {whyNews.length > 0 && (
            <ul className={styles.newsChips} aria-label="근거 뉴스">
              {whyNews.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.newsChip}
                  >
                    {item.title}
                    <span className="visually-hidden">(새 창에서 열려요)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.aiNote}>AI가 뉴스와 숫자를 바탕으로 정리했어요</p>
        </section>
      )}

      <section className={styles.section} aria-labelledby="industry-numbers">
        <h2 id="industry-numbers" className={styles.sectionTitle}>
          숫자로 보기
        </h2>
        {detail.trend.length > 0 && last && (
          <div>
            <p className={styles.chartTitle}>
              최근 1개월 주가 흐름{' '}
              <span className={styles.chartNote}>(1개월 전 대비, 주 단위)</span>
            </p>
            <TrendChart
              points={detail.trend}
              formatValue={signedPercent}
              ariaLabel={`최근 1개월 주가 흐름, ${detail.trend.map((p) => `${p.date} ${signedPercent(p.value)}`).join(', ')}`}
            />
          </div>
        )}
        <ScoreTable detail={detail} />
        <ul className={styles.criteria}>
          {HEAT_CRITERIA_TEXT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="industry-news">
        <h2 id="industry-news" className={styles.sectionTitle}>
          관련 뉴스
        </h2>
        <NewsList
          items={news.data ?? []}
          isPending={news.isPending}
          isError={news.isError}
          label="관련 뉴스"
        />
      </section>

      <section className={styles.section} aria-labelledby="industry-companies">
        <h2 id="industry-companies" className={styles.sectionTitle}>
          관련 기업 <span className={styles.sectionNote}>시가총액 큰 순</span>
        </h2>
        {companies.length === 0 ? (
          <p className={styles.empty}>아직 정리된 기업이 없어요.</p>
        ) : (
          <ol className={styles.companies} aria-label="관련 기업">
            {companies.slice(0, companyCount).map((company, index) => (
              <li key={company.stock_code}>
                <Link to={`/companies/${company.stock_code}`} className={styles.company}>
                  <span className={styles.rank}>{index + 1}</span>
                  <span className={styles.companyMain}>
                    <span className={styles.companyName}>{company.name}</span>
                    <span className={styles.companyIntro}>{company.intro}</span>
                  </span>
                  <span className={styles.companySide}>
                    <span className={styles.cap}>{aboutCap(company.market_cap)}</span>
                    <span
                      className={`${styles.rate} ${styles[changeDirection(company.change_rate)]}`}
                    >
                      {signedPercent(company.change_rate)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        {companies.length > companyCount && (
          <Button
            variant="secondary"
            block
            onClick={() => setCompanyCount((n) => n + COMPANY_PAGE)}
          >
            더 보기
          </Button>
        )}
      </section>

      <p className={styles.disclaimer}>{HEAT_DISCLAIMER}</p>
    </div>
  );
}
