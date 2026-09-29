import { useState, type ReactNode } from 'react';
import { BarChart } from '../../components/BarChart';
import { Section } from '../../components/Section';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TermText } from '../../components/TermText';
import type { Financials } from '../../types';
import { formatTrillion } from '../../utils/format';
import { calcOperatingIncomeGrowth, calcRevenueGrowth } from './indicators';
import styles from './Financials.module.css';

type Metric = 'revenue' | 'operating_income';

const metricOptions = [
  { value: 'revenue', label: '매출' },
  { value: 'operating_income', label: '영업이익' },
] as const;

interface AnnualFinancialsSectionProps {
  financials: Financials;
  title: string;
  /** 그래프 아래에 덧붙일 내용 (예: 자세히 보기 버튼) */
  children?: ReactNode;
}

/** 매출 / 영업이익 3년 막대그래프 (토글 전환, 최신 연도 진하게). 차트 탭과 재무 분석 탭에서 함께 써요. */
export function AnnualFinancialsSection({
  financials,
  title,
  children,
}: AnnualFinancialsSectionProps) {
  const [metric, setMetric] = useState<Metric>('revenue');

  const annual = [...financials.annual].sort((a, b) => a.fiscal_year - b.fiscal_year);
  const latestYear = annual.at(-1)?.fiscal_year;
  const chartData = annual.map((row) => ({
    label: `${row.fiscal_year}년`,
    value: row[metric],
    highlight: row.fiscal_year === latestYear,
  }));

  const growth =
    metric === 'revenue' ? calcRevenueGrowth(annual) : calcOperatingIncomeGrowth(annual);
  const verb =
    metric === 'revenue'
      ? growth !== null && growth >= 0
        ? '더 많이 팔았어요'
        : '덜 팔았어요'
      : growth !== null && growth >= 0
        ? '더 벌었어요'
        : '덜 벌었어요';
  const metricLabel = metric === 'revenue' ? '매출액' : '영업이익';

  return (
    <Section
      title={title}
      action={
        <SegmentedControl
          label="그래프 항목"
          options={metricOptions}
          value={metric}
          onChange={setMetric}
        />
      }
    >
      <BarChart
        data={chartData}
        formatValue={(v) => formatTrillion(v).replace(' 원', '')}
        ariaLabel={`${metricLabel} ${chartData.map((d) => `${d.label} ${formatTrillion(d.value)}`).join(', ')}`}
      />
      {growth !== null && (
        <p className={styles.chartSentence}>
          {latestYear}년 <TermText text={metricLabel} />은 작년보다 {Math.round(Math.abs(growth))}%{' '}
          {verb}.
        </p>
      )}
      <p className={styles.caption}>
        단위: {financials.unit} · {financials.basis} · 출처: {financials.source}
      </p>
      {children}
    </Section>
  );
}
