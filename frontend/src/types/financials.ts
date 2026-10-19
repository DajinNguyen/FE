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
