import { useState } from 'react';
import { BarChart } from '../../components/BarChart';
import { Section } from '../../components/Section';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TermText } from '../../components/TermText';
import type { FinancialsEvidence } from '../../types';
import type { GoToTab } from '../companyTabs';
import styles from './Overview.module.css';

type Metric = 'revenue' | 'operating_income';

const metricOptions = [
  { value: 'revenue', label: '매출' },
  { value: 'operating_income', label: '영업이익' },
] as const;

const metricLabel: Record<Metric, string> = { revenue: '매출', operating_income: '영업이익' };

/** 개요 화면의 핵심 그래프 1개: 3년 매출·영업이익 막대 (토글) */
export function CoreChart({
  financials,
  onGoToTab,
}: {
  financials: FinancialsEvidence | null;
  onGoToTab: GoToTab;
}) {
  const [metric, setMetric] = useState<Metric>('revenue');

  if (!financials || financials.years.length === 0) {
    return (
      <Section title="3년 동안 얼마나 벌었나요?">
        <p className={styles.notFound}>자료를 찾지 못했어요</p>
      </Section>
    );
  }

  const values = financials[metric];
  const unitShort = financials.unit.replace(/\s*원$/, '');
  const data = financials.years.map((year, i) => ({
    label: `${year}년`,
    value: values[i] ?? 0,
    highlight: i === financials.years.length - 1,
  }));
  const first = values[0];
  const last = values.at(-1);
  const times = first && last && first > 0 ? last / first : null;

  return (
    <Section
      title="3년 동안 얼마나 벌었나요?"
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
        data={data}
        height={240}
        formatValue={(v) => `${v.toLocaleString('ko-KR')}${unitShort}`}
        ariaLabel={`${metricLabel[metric]} ${data.map((d) => `${d.label} ${d.value}${financials.unit}`).join(', ')}`}
      />
      {times !== null && last !== undefined && (
        <p className={styles.chartSentence}>
          <TermText text={metricLabel[metric]} />이 {financials.years[0]}년{' '}
          {first.toLocaleString('ko-KR')}
          {financials.unit}에서 {financials.years.at(-1)}년 {last.toLocaleString('ko-KR')}
          {financials.unit}
          {times >= 1.1
            ? `으로 약 ${times.toFixed(1)}배가 됐어요.`
            : times < 1
              ? '으로 줄었어요.'
              : '으로 비슷했어요.'}
        </p>
      )}
      <p className={styles.caption}>
        단위: {financials.unit}
        {financials.base_date ? ` · ${financials.base_date}` : ''}
        <button type="button" className={styles.inlineLink} onClick={() => onGoToTab('financials')}>
          분기·사업별 그래프는 재무 상세에서 볼 수 있어요
        </button>
      </p>
    </Section>
  );
}
