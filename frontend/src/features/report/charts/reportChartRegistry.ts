import type { ComponentType } from 'react';
import type { Financials, ReportChart, ReportChartType } from '../../../types';
import {
  AnnualOperatingIncomeChart,
  AnnualRevenueChart,
  OperatingMarginChart,
  SegmentRevenueChart,
  type ReportChartProps,
} from './ReportCharts';

/**
 * 리포트 그래프 type → 그리는 컴포넌트.
 * 새 그래프를 추가하려면: ReportCharts.tsx 에 컴포넌트 추가 → 여기 등록 → types/report.ts 의 ReportChartType 에 추가.
 */
const chartRenderers: Record<ReportChartType, ComponentType<ReportChartProps>> = {
  annual_revenue: AnnualRevenueChart,
  annual_operating_income: AnnualOperatingIncomeChart,
  operating_margin: OperatingMarginChart,
  segment_revenue: SegmentRevenueChart,
};

/** 기준 문구 (단위·기간). 그래프 아래 작은 글씨로 보여줘요. */
export function chartBasis(chart: ReportChart, financials: Financials) {
  if (chart.type === 'segment_revenue')
    return `${financials.segments.base_label} · 단위: ${financials.unit}`;
  if (chart.type === 'operating_margin') return `${financials.basis} · 매출과 영업이익으로 계산`;
  return `${financials.basis} · 단위: ${financials.unit}`;
}

/** 모르는 type 이면 null (화면에서 건너뛰어요) */
export function getChartRenderer(type: string) {
  return (
    (chartRenderers as Record<string, ComponentType<ReportChartProps> | undefined>)[type] ?? null
  );
}
