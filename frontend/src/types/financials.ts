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
  /** 작년 대비 변화율이 아직 확인하지 않은 예시 값이면 true */
  yoy_is_sample?: boolean;
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
