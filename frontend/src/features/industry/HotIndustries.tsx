import { useState } from 'react';
import { Link } from 'react-router';
import { DataAsOf } from '../../components/DataAsOf';
import { ErrorState } from '../../components/ErrorState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { DEFAULT_HEAT_PERIOD, HEAT_PERIODS } from '../../config/industryHeat';
import { industryColorStyle, industryIcon } from '../../config/industryIcons';
import { useHotIndustries } from '../../hooks/useIndustries';
import type { HeatPeriod, IndustrySummary } from '../../types';
import { HeatCriteriaSheet } from './HeatCriteriaSheet';
import { changeDirection, changeWords, signedPercent, topIndustries } from './industryText';
import styles from './Industry.module.css';

/** 순위별 아이콘 크기 (px): 1위가 가장 커요 */
const iconSize = [48, 40, 36];

const periodOptions = HEAT_PERIODS.map((p) => ({ value: p.id, label: p.label }));

function IndustryCard({ industry, rank }: { industry: IndustrySummary; rank: number }) {
  const Icon = industryIcon(industry.icon_key);
  const metric = industry.headline_metric;
  const direction = changeDirection(metric.value);
  return (
    <li>
      <Link
        to={`/industries/${industry.industry_id}`}
        className={styles.hotItem}
        style={industryColorStyle(industry.icon_key)}
        data-rank={rank}
        aria-label={`${rank}위 ${industry.name} 산업, ${metric.label} ${changeWords(metric.value)}`}
      >
        <span className={styles.hotRank}>{rank}위</span>
        <span className={styles.hotIcon} aria-hidden="true">
          <Icon size={iconSize[rank - 1]} strokeWidth={1.5} />
        </span>
        <span className={styles.hotName}>{industry.name}</span>
        <span className={styles.hotMetric}>
          {metric.label} <span className={styles[direction]}>{signedPercent(metric.value)}</span>
        </span>
        <DataAsOf value={industry.as_of} className={styles.hotAsOf} />
      </Link>
    </li>
  );
}

/** 메인의 시각적 포인트 "관심이 몰리는 산업 TOP 3": 점수 상위 3개를 가로로 크게, 1위일수록 더 크게 */
export function HotIndustries() {
  const [period, setPeriod] = useState<HeatPeriod>(DEFAULT_HEAT_PERIOD);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useHotIndustries(period);
  const top = data ? topIndustries(data) : [];

  return (
    <section className={styles.hot} aria-labelledby="hot-industries">
      <div className={styles.hotHead}>
        <div className={styles.hotTitleRow}>
          <h2 id="hot-industries" className={styles.hotTitle}>
            관심이 몰리는 산업 TOP 3
          </h2>
          <button
            type="button"
            className={styles.criteriaButton}
            onClick={() => setCriteriaOpen(true)}
          >
            기준 보기
          </button>
        </div>
        <SegmentedControl
          options={periodOptions}
          value={period}
          onChange={setPeriod}
          label="기간"
        />
      </div>

      {isPending && (
        <div className={styles.hotList} aria-hidden="true">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className={styles.hotSkeleton} data-rank={rank} />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState
          compact
          title="산업 정보를 불러오지 못했어요"
          error={error}
          onRetry={() => refetch()}
        />
      )}
      {data && top.length === 0 && <p className={styles.message}>아직 보여줄 산업이 없어요.</p>}
      {top.length > 0 && (
        <ol className={styles.hotList} aria-label="관심이 몰리는 산업 상위 3개">
          {top.map((industry, index) => (
            <IndustryCard key={industry.industry_id} industry={industry} rank={index + 1} />
          ))}
        </ol>
      )}

      <HeatCriteriaSheet open={criteriaOpen} onClose={() => setCriteriaOpen(false)} />
    </section>
  );
}
