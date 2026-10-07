import { BarChart } from '../../../components/BarChart';
import { HorizontalBars } from '../../../components/HorizontalBars';
import type { Financials } from '../../../types';
import { formatTrillion } from '../../../utils/format';
import { calcOperatingMarginByYear } from '../../financials/indicators';

/** 리포트 그래프는 모두 같은 props 를 받아요. 숫자는 항상 공식 재무 데이터에서 가져와요. */
export interface ReportChartProps {
  financials: Financials;
}

const latestYearOf = (financials: Financials) =>
  Math.max(...financials.annual.map((row) => row.fiscal_year));

const annualBars = (financials: Financials, key: 'revenue' | 'operating_income') => {
  const latest = latestYearOf(financials);
  return [...financials.annual]
    .sort((a, b) => a.fiscal_year - b.fiscal_year)
    .map((row) => ({
      label: `${row.fiscal_year}년`,
      value: row[key],
      highlight: row.fiscal_year === latest,
    }));
};

const trillionLabel = (v: number) => formatTrillion(v).replace(' 원', '');

export function AnnualRevenueChart({ financials }: ReportChartProps) {
  const data = annualBars(financials, 'revenue');
  return (
    <BarChart
      data={data}
      height={180}
      formatValue={trillionLabel}
      ariaLabel={`연도별 매출 ${data.map((d) => `${d.label} ${formatTrillion(d.value)}`).join(', ')}`}
    />
  );
}

export function AnnualOperatingIncomeChart({ financials }: ReportChartProps) {
  const data = annualBars(financials, 'operating_income');
  return (
    <BarChart
      data={data}
      height={180}
      formatValue={trillionLabel}
      ariaLabel={`연도별 영업이익 ${data.map((d) => `${d.label} ${formatTrillion(d.value)}`).join(', ')}`}
    />
  );
}

/** 연도별 영업이익률: 원본 매출·영업이익으로 계산해요. */
export function OperatingMarginChart({ financials }: ReportChartProps) {
  const latest = latestYearOf(financials);
  const data = calcOperatingMarginByYear(financials.annual).map((row) => ({
    label: `${row.fiscal_year}년`,
    value: Math.round(row.margin * 10) / 10,
    highlight: row.fiscal_year === latest,
  }));
  return (
    <BarChart
      data={data}
      height={180}
      formatValue={(v) => `${v}%`}
      ariaLabel={`연도별 영업이익률 ${data.map((d) => `${d.label} ${d.value}%`).join(', ')}`}
    />
  );
}

export function SegmentRevenueChart({ financials }: ReportChartProps) {
  return (
    <HorizontalBars
      data={financials.segments.items.map((s) => ({ id: s.code, label: s.name, value: s.revenue }))}
      formatValue={(v) => formatTrillion(v)}
    />
  );
}
