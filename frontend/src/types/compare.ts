/** 비교하기의 한 회사 — 금액은 unit(예: "조 원"), 비율은 % */
export interface CompareCompany {
  stock_code: string;
  name: string;
  sector: string;
  /** 시가총액 (조 원) */
  market_cap: number | null;
  /** 은행·보험 등 금융업이면 부채비율을 비교하지 않아요 */
  is_financial: boolean;
  revenue: number | null;
  operating_income: number | null;
  /** 영업이익률 (%) */
  operating_margin: number | null;
  /** 매출 증가율 (전년 대비 %) */
  revenue_growth: number | null;
  /** 부채비율 (%) */
  debt_ratio: number | null;
  unit: string;
  /** 이 회사 숫자의 기준 (예: "2025년 연간", "연결 기준"). 두 회사가 다르면 안내해요. */
  base_period?: string;
  basis?: string;
}

export interface CompareSource {
  title: string;
  url: string;
  /** YYYY-MM-DD */
  date: string;
}

/** AI 분석 (있을 때만) */
export interface CompareAnalysis {
  headline: string;
  points: { title: string; description: string }[];
  /** 왜 다른가요? (사업 구성 차이 1~2문장) */
  reason: string | null;
  sources: CompareSource[];
}

/** GET /api/companies/compare?left=&right= */
export interface CompanyCompare {
  /** 두 회사 공통 기준 기간 (예: "2025년 연간") */
  base_period: string;
  /** 예: "연결 기준" */
  basis: string;
  left: CompareCompany;
  right: CompareCompany;
  analysis?: CompareAnalysis | null;
}
