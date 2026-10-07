import type { SampleNumber } from './common';
import type { CompanySummary } from './company';

/** 오늘 거래가 많은 기업 항목 */
export interface TradingCompany extends CompanySummary {
  /** 거래대금 (억 원) */
  trading_value: SampleNumber;
}

export interface CompanyRanking {
  /** 이 목록을 어떤 기준으로 뽑았는지 (화면에 그대로 보여줘요) */
  criteria: string;
  items: CompanySummary[];
}

/** AI가 분석한 기업 카드 */
export interface AnalyzedCompany {
  stock_code: string;
  name: string;
  headline: string;
  generated_at: string;
}

/** GET /api/home 응답 (백엔드 결정 대기: 떠오르는·관심도 기준) */
export interface HomeDashboard {
  /** 거래대금 기준 시각 (예: "2026-10-06 15:30") */
  base_time: string;
  trading_value_top: TradingCompany[];
  rising: CompanyRanking;
  most_viewed: CompanyRanking;
  ai_analyzed: AnalyzedCompany[];
}
