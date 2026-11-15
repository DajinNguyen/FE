import { ApiError } from '../../api/errors';
import { DataAsOf } from '../../components/DataAsOf';
import { ErrorState } from '../../components/ErrorState';
import { HorizontalBars } from '../../components/HorizontalBars';
import { Icon } from '../../components/Icon';
import { Section } from '../../components/Section';
import { usePerformanceDetail } from '../../hooks/usePerformanceDetail';
import type { PerformanceDetail } from '../../types';
import { formatAmount, formatSignedPercent } from '../../utils/format';
import type { GoToTab } from '../companyTabs';
import { PERFORMANCE_ANCHOR } from '../financials/PerformanceAnalysis';
import styles from './RecentPerformance.module.css';

const TITLE = '최근 사업 성과';

/** "2026-01-29" → "2026년 1월 발표" */
const announcedText = (date: string) => {
  const [year, month] = date.split('-');
  return `${year}년 ${Number(month)}월 발표`;
};

/** 큰 숫자 + 작은 단위, 아래 "작년 같은 분기보다 ▲+23.7%" */
function Metric({
  label,
  value,
  unit,
  rate,
}: {
  label: string;
  value: number;
  unit: string;
  rate: number | null | undefined;
}) {
  return (
    <div className={styles.metric}>
      <dt className={styles.metricLabel}>{label}</dt>
      <dd className={styles.metricValue}>
        {formatAmount(value)}
        <span className={styles.unit}>{unit}</span>
      </dd>
      {rate != null && (
        <dd className={styles.yoy}>
          작년 같은 분기보다{' '}
          <span className={rate >= 0 ? styles.rise : styles.fall}>
            <span aria-hidden="true">{rate >= 0 ? '▲' : '▼'}</span>
            <span className="visually-hidden">{rate >= 0 ? '늘었어요' : '줄었어요'}</span>
            {formatSignedPercent(rate, 1)}
          </span>
        </dd>
      )}
    </div>
  );
}

/** 재무 상세 분석(PerformanceDetail)을 요약해요. 화면에서 새 숫자를 만들지 않고 받은 값만 써요. */
function Summary({ data, onMore }: { data: PerformanceDetail; onMore: () => void }) {
  const { summary, yoy, unit, source } = data;
  const segments = [...data.segments].sort((a, b) => b.revenue - a.revenue);
  return (
    <>
      {summary && (
        <dl className={styles.metrics}>
          <Metric label="매출" value={summary.revenue} unit={unit} rate={yoy?.revenue_rate} />
          <Metric
            label="영업이익"
            value={summary.operating_income}
            unit={unit}
            rate={yoy?.operating_income_rate}
          />
        </dl>
      )}
      {data.ai_summary && (
        <p className={styles.summary}>
          <span className={styles.aiLabel}>AI 한 줄 요약</span> {data.ai_summary}
        </p>
      )}
      {segments.length > 0 && (
        <div className={styles.segments}>
          <p className={styles.segmentsTitle}>사업별 매출</p>
          <HorizontalBars
            data={segments.map((s) => ({ id: s.name, label: s.name, value: s.revenue }))}
            formatValue={(v) => formatAmount(v, unit)}
          />
        </div>
      )}
      {source && (
        <p className={styles.source}>
          출처:{' '}
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title} <Icon name="external" size={14} />
            <span className="visually-hidden">(새 창에서 열려요)</span>
          </a>{' '}
          · <DataAsOf value={source.date} suffix="공시" />
        </p>
      )}
      <button type="button" className={styles.more} onClick={onMore}>
        자세히 보기 <Icon name="chevronRight" size={16} />
      </button>
    </>
  );
}

const hasAny = (d: PerformanceDetail) =>
  Boolean(d.summary || d.ai_summary || d.segments.length > 0 || d.source);

/**
 * 개요 "최근 사업 성과": 재무 상세 "최근 사업 성과 분석"과 같은 데이터(usePerformanceDetail)를 요약해요.
 * [자세히 보기]는 재무 상세의 분석 위치로 이동해요.
 */
export function RecentPerformance({
  stockCode,
  onGoToTab,
}: {
  stockCode: string;
  onGoToTab: GoToTab;
}) {
  const { data, isPending, isError, error, refetch } = usePerformanceDetail(stockCode);

  if (isPending) {
    return (
      <Section title={TITLE}>
        <div className={styles.skeleton} aria-hidden="true" />
      </Section>
    );
  }
  // 404 는 "아직 자료가 없음"이라 에러가 아니라 빈 안내를 보여줘요.
  const notFound = error instanceof ApiError && error.status === 404;
  if (isError && !notFound) {
    return (
      <Section title={TITLE}>
        <ErrorState compact error={error} onRetry={() => refetch()} />
      </Section>
    );
  }
  if (!data || !hasAny(data)) {
    return (
      <Section title={TITLE}>
        <p className={styles.empty}>아직 최근 실적 자료가 없어요</p>
      </Section>
    );
  }

  return (
    <Section
      title={TITLE}
      description={`${data.period_label} 실적 · ${announcedText(data.announced_at)}`}
    >
      <Summary data={data} onMore={() => onGoToTab('financials', PERFORMANCE_ANCHOR)} />
    </Section>
  );
}
