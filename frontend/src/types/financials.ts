import type { SampleNumber } from './common';

export interface AnnualFinancial {
  fiscal_year: number;
  /** 매출액 (unit 단위) */
  revenue: number;
  /** 영업이익 (unit 단위) */
  operating_income: number;
}

export interface QuarterFinancial {
  label: string;
  revenue: number;
  operating_income: number;
  note: string;
}

export interface SegmentRevenue {
  code: string;
  name: string;
  revenue: number;
}

/** 최근 실적 숫자 하나. yoy_change_rate 는 작년 같은 분기 대비 (%) */
export interface PerformanceMetric {
  value: number;
  unit: string;
  yoy_change_rate: number | null;
}

/** 개요 "최근 사업 성과" (실적 발표 요약) */
export interface RecentPerformance {
  /** 예: "2025년 4분기 실적" */
  period_label: string;
  /** 발표일 (YYYY-MM-DD) */
  announced_at: string;
  revenue: PerformanceMetric;
  operating_income: PerformanceMetric;
  /** AI 한 줄 요약 */
  summary: string;
  /** 사업별 매출 */
  segments: { name: string; revenue: number; unit: string }[];
  /** 출처 (DART 공시명·날짜) */
  source: { title: string; date: string; url: string };
}

/** 지표 비교 기준. 예: { basis: "sector_median", basis_value: 7.5, basis_label: "반도체 업종 중앙값" } */
export interface IndicatorBenchmark {
  basis: 'sector_median' | 'general';
  /** 비교할 값 (%, 배). 없으면 비교 문장을 빼요. */
  basis_value: number | null;
  basis_label: string;
}

export type BenchmarkedIndicator =
  'revenue_growth' | 'operating_margin' | 'roe' | 'debt_ratio' | 'per';

/** GET /api/companies/{stock_code}/financials 응답 */
export interface Financials {
  stock_code: string;
  unit: string;
  basis: string;
  source: string;
  annual: AnnualFinancial[];
  latest_quarter: QuarterFinancial;
  segments: {
    base_label: string;
    items: SegmentRevenue[];
  };
  /** PER·PBR·ROE·부채비율의 기준 (예: "2025년 사업보고서"). 없으면 기준 표시를 숨겨요. */
  indicators_as_of: string | null;
  /** 지표별 비교 기준 (업종 중앙값 등). 없는 지표는 프론트 기본 기준으로 판단해요. */
  benchmarks?: Partial<Record<BenchmarkedIndicator, IndicatorBenchmark>>;
  /** 평가 예외: 금융업(부채비율 제외), 적자(PER 계산 불가), 자본잠식(ROE·부채비율 제외) */
  flags?: { is_financial: boolean; is_loss: boolean; is_capital_impaired: boolean };
  /** 최근 실적 발표 요약. 없으면 null */
  recent_performance: RecentPerformance | null;
  indicators: {
    /** ROE (%) */
    roe: SampleNumber;
    /** 부채비율 (%) */
    debt_ratio: SampleNumber;
    /** PER (배) */
    per: SampleNumber;
    /** PBR (배) */
    pbr: SampleNumber;
  };
}
