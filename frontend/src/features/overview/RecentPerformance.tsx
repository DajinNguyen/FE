import { DataAsOf } from '../../components/DataAsOf';
import { HorizontalBars } from '../../components/HorizontalBars';
import { Icon } from '../../components/Icon';
import { SampleBadge } from '../../components/SampleBadge';
import { Section } from '../../components/Section';
import { useFinancials } from '../../hooks/useFinancials';
import type { PerformanceMetric } from '../../types';
import { formatSignedPercent } from '../../utils/format';
import styles from './RecentPerformance.module.css';

/** "2026-01-29" → "2026년 1월" */
const announcedText = (date: string) => {
  const [year, month] = date.split('-');
  return `${year}년 ${Number(month)}월 발표`;
};

function Metric({ label, metric }: { label: string; metric: PerformanceMetric }) {
  const rate = metric.yoy_change_rate;
  return (
    <div className={styles.metric}>
      <dt className={styles.metricLabel}>{label}</dt>
      <dd className={styles.metricValue}>
        {metric.value.toLocaleString('ko-KR')}
        <span className={styles.unit}>{metric.unit}</span>
      </dd>
      {rate !== null && (
        <dd className={styles.yoy}>
          작년 같은 분기보다{' '}
          <span className={rate >= 0 ? styles.rise : styles.fall}>
            <span aria-hidden="true">{rate >= 0 ? '▲' : '▼'}</span>
            <span className="visually-hidden">{rate >= 0 ? '늘었어요' : '줄었어요'}</span>
            {formatSignedPercent(rate, 1)}
          </span>{' '}
          <SampleBadge isSample={metric.yoy_is_sample} />
        </dd>
      )}
    </div>
  );
}

/** 개요 "최근 사업 성과": 실적 발표 요약 */
export function RecentPerformance({ stockCode }: { stockCode: string }) {
  const { data, isPending } = useFinancials(stockCode);
  const perf = data?.recent_performance;

  if (isPending) return null;
  if (!perf) {
    return (
      <Section title="최근 사업 성과">
        <p className={styles.empty}>최근 실적 발표 자료를 아직 불러오지 못했어요.</p>
      </Section>
    );
  }

  return (
    <Section
      title="최근 사업 성과"
      description={`${perf.period_label} · ${announcedText(perf.announced_at)}`}
    >
      <dl className={styles.metrics}>
        <Metric label="매출" metric={perf.revenue} />
        <Metric label="영업이익" metric={perf.operating_income} />
      </dl>
      <p className={styles.summary}>
        <span className={styles.aiLabel}>AI 한 줄 요약</span> {perf.summary}
      </p>
      {perf.segments.length > 0 && (
        <div className={styles.segments}>
          <p className={styles.segmentsTitle}>사업별 매출</p>
          <HorizontalBars
            data={perf.segments.map((s) => ({ id: s.name, label: s.name, value: s.revenue }))}
            formatValue={(v) => `${v.toLocaleString('ko-KR')}${perf.segments[0].unit}`}
          />
        </div>
      )}
      <p className={styles.source}>
        출처:{' '}
        <a href={perf.source.url} target="_blank" rel="noopener noreferrer">
          {perf.source.title} <Icon name="external" size={14} />
          <span className="visually-hidden">(새 창에서 열려요)</span>
        </a>{' '}
        · <DataAsOf value={perf.source.date} suffix="공시" />
      </p>
    </Section>
  );
}
