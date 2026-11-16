import type { CompareCompany } from '../../types';
import { formatAmount } from '../../utils/format';

export type MetricKey =
  'revenue' | 'operating_income' | 'operating_margin' | 'revenue_growth' | 'debt_ratio';

export interface CompareMetric {
  key: MetricKey;
  label: string;
  kind: 'money' | 'percent';
  /** 음수면 "적자" (매출 증가율은 감소라서 적자가 아니에요) */
  lossWhenNegative: boolean;
}

export const COMPARE_METRICS: CompareMetric[] = [
  { key: 'revenue', label: '매출', kind: 'money', lossWhenNegative: false },
  { key: 'operating_income', label: '영업이익', kind: 'money', lossWhenNegative: true },
  { key: 'operating_margin', label: '영업이익률', kind: 'percent', lossWhenNegative: true },
  { key: 'revenue_growth', label: '매출 증가율', kind: 'percent', lossWhenNegative: false },
  { key: 'debt_ratio', label: '부채비율', kind: 'percent', lossWhenNegative: false },
];

/** 둘 중 하나라도 금융업이면 부채비율은 비교하지 않아요. (은행은 예금이 부채라서) */
export function visibleMetrics(left: CompareCompany, right: CompareCompany) {
  const financial = left.is_financial || right.is_financial;
  return COMPARE_METRICS.filter((m) => !(financial && m.key === 'debt_ratio'));
}

/** "300.9조 원", "35.5%", 음수는 "−2.3조 원" */
export function formatMetric(metric: CompareMetric, value: number, unit: string) {
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(value);
  return metric.kind === 'money'
    ? `${sign}${formatAmount(abs, unit)}`
    : `${sign}${abs.toFixed(1)}%`;
}

/** 모든 지표가 비어 있으면 true */
export const hasNoNumbers = (c: CompareCompany) => COMPARE_METRICS.every((m) => c[m.key] === null);
