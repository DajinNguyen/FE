import { Link } from 'react-router';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { SampleBadge } from '../../components/SampleBadge';
import { Section } from '../../components/Section';
import { TermText } from '../../components/TermText';
import { useCompany } from '../../hooks/useCompanies';
import { useFinancials } from '../../hooks/useFinancials';
import { formatTrillion } from '../../utils/format';
import styles from './CompanyInfo.module.css';

const marketLabel = { KOSPI: '코스피', KOSDAQ: '코스닥' } as const;

/** 업종 + 소속 산업 칩 (산업 페이지로) */
function IndustryLine({
  sector,
  industries,
}: {
  sector: string;
  industries: { industry_id: string; name: string }[];
}) {
  return (
    <p className={styles.industryLine}>
      <span className={styles.industryLabel}>업종</span> {sector}
      {industries.length > 0 && (
        <>
          <span className={styles.industryLabel}>소속 산업</span>
          {industries.map((industry) => (
            <Link
              key={industry.industry_id}
              to={`/industries/${industry.industry_id}`}
              className={styles.industryChip}
            >
              {industry.name} 산업 보기
            </Link>
          ))}
        </>
      )}
    </p>
  );
}

/** 개요 탭의 기업 정보: 무슨 사업을 하나요? · 회사의 방향 · 기본 정보 */
export function CompanyInfo({ stockCode }: { stockCode: string }) {
  const { data: company } = useCompany(stockCode);
  const { data: financials } = useFinancials(stockCode);

  if (!company) return <p className={styles.loading}>기업 정보를 불러오고 있어요…</p>;

  return (
    <div>
      {company.business_description || company.business_segments.length > 0 ? (
        <Section title="무슨 사업을 하나요?">
          {company.business_description && (
            <p className={styles.lead}>
              <TermText text={company.business_description} />
            </p>
          )}
          <IndustryLine sector={company.sector} industries={company.industries} />
          <ul className={styles.segments}>
            {company.business_segments.map((segment) => (
              <li key={segment.code} className={styles.segment}>
                <p className={styles.segmentName}>{segment.name}</p>
                <p className={styles.segmentDescription}>
                  <TermText text={segment.description} />
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        <Section title="무슨 사업을 하나요?">
          <IndustryLine sector={company.sector} industries={company.industries} />
          <EmptyState
            title="자료를 찾지 못했어요"
            description="사업보고서 내용을 아직 불러오지 못했어요."
          />
        </Section>
      )}

      {company.timeline.length > 0 && (
        <Section title="회사의 방향" description={`출처: ${company.timeline_source}`}>
          <ol className={styles.timeline}>
            {company.timeline.map((item) => (
              <li
                key={item.year}
                className={`${styles.timelineItem} ${item.is_plan ? styles.plan : ''}`}
              >
                <span className={styles.year}>
                  {item.year}
                  {item.is_plan && <span className={styles.planTag}>계획</span>}
                </span>
                <p className={styles.timelineTitle}>{item.title}</p>
                <p className={styles.timelineDescription}>
                  <TermText text={item.description} />
                </p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section title="기본 정보">
        <dl className={styles.facts}>
          <div>
            <dt>업종</dt>
            <dd>{company.sector}</dd>
          </div>
          <div>
            <dt>종목코드</dt>
            <dd>
              {company.stock_code} · {marketLabel[company.market]}
            </dd>
          </div>
          {company.corp_code && (
            <div>
              <dt>DART 고유번호</dt>
              <dd>{company.corp_code}</dd>
            </div>
          )}
          {company.market_cap && (
            <div>
              <dt>
                <TermText text="시가총액" />
              </dt>
              <dd>
                {formatTrillion(company.market_cap.value, { min: 0, max: 0 })}{' '}
                <SampleBadge isSample={company.market_cap.is_sample} />
              </dd>
            </div>
          )}
          {financials && (
            <div>
              <dt>
                <TermText text="PBR" />
              </dt>
              <dd>
                {financials.indicators.pbr.value}배{' '}
                <SampleBadge isSample={financials.indicators.pbr.is_sample} />
              </dd>
            </div>
          )}
        </dl>

        <div className={styles.externalLinks}>
          {company.homepage_url && (
            <a
              href={company.homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              회사 홈페이지 <Icon name="external" size={16} />
            </a>
          )}
          <a
            href={company.dart_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
          >
            DART 공시 보기 <Icon name="external" size={16} />
          </a>
        </div>
      </Section>
    </div>
  );
}
