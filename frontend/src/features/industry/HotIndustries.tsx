import { useState } from 'react';
import { Link } from 'react-router';
import { DataAsOf } from '../../components/DataAsOf';
import { SampleBadge } from '../../components/SampleBadge';
import { SegmentedControl } from '../../components/SegmentedControl';
import { DEFAULT_HEAT_PERIOD, HEAT_PERIODS } from '../../config/industryHeat';
import { industryIcon } from '../../config/industryIcons';
import { useHotIndustries } from '../../hooks/useIndustries';
import type { HeatLevel, HeatPeriod, IndustrySummary } from '../../types';
import { HeatCriteriaSheet } from './HeatCriteriaSheet';
import { changeDirection, changeWords, heatLevelLabel, signedPercent } from './industryText';
import styles from './Industry.module.css';

/** 관심도에 따라 아이콘 크기 3단계 (px) */
const iconSize: Record<HeatLevel, number> = { high: 36, mid: 28, low: 22 };

const periodOptions = HEAT_PERIODS.map((p) => ({ value: p.id, label: p.label }));

function IndustryIcon({ industry }: { industry: IndustrySummary }) {
  const Icon = industryIcon(industry.icon_key);
  const metric = industry.headline_metric;
  const direction = changeDirection(metric.value);
  return (
    <li>
      <Link
        to={`/industries/${industry.industry_id}`}
        className={styles.hotItem}
        data-level={industry.heat_level}
        aria-label={`${industry.name} 산업, ${metric.label} ${changeWords(metric.value)}, ${heatLevelLabel[industry.heat_level]}`}
      >
        <span className={styles.hotIcon} aria-hidden="true">
          <Icon size={iconSize[industry.heat_level]} strokeWidth={1.75} />
        </span>
        <span className={styles.hotName}>{industry.name}</span>
        <span className={styles.hotMetric}>
          {metric.label} <span className={styles[direction]}>{signedPercent(metric.value)}</span>
        </span>
      </Link>
    </li>
  );
}

/** 메인 "지금 관심이 몰리는 산업": 아이콘 크기 = 관심도, 아래에 대표 숫자 */
export function HotIndustries() {
  const [period, setPeriod] = useState<HeatPeriod>(DEFAULT_HEAT_PERIOD);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const { data, isPending, isError } = useHotIndustries(period);
  const first = data?.[0];

  return (
    <section className={styles.hot} aria-labelledby="hot-industries">
      <div className={styles.hotHead}>
        <div>
          <h2 id="hot-industries" className={styles.hotTitle}>
            지금 관심이 몰리는 산업
          </h2>
          {first && (
            <p className={styles.hotNote}>
              <DataAsOf value={first.as_of} /> <SampleBadge isSample={first.is_sample} />
            </p>
          )}
        </div>
        <button
          type="button"
          className={styles.criteriaButton}
          onClick={() => setCriteriaOpen(true)}
        >
          기준 보기
        </button>
      </div>
      <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} label="기간" />

      {isPending && <div className={styles.hotSkeleton} aria-hidden="true" />}
      {isError && (
        <p className={styles.message}>산업 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>
      )}
      {data && data.length === 0 && <p className={styles.message}>아직 보여줄 산업이 없어요.</p>}
      {data && data.length > 0 && (
        <ul className={styles.hotList} aria-label="관심이 몰리는 산업">
          {data.map((industry) => (
            <IndustryIcon key={industry.industry_id} industry={industry} />
          ))}
        </ul>
      )}

      <HeatCriteriaSheet open={criteriaOpen} onClose={() => setCriteriaOpen(false)} />
    </section>
  );
}
