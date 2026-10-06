import type { SampleNumber } from './common';

/** GET /api/companies?query= , /api/companies/popular 응답 항목 */
export interface CompanySummary {
  stock_code: string;
  corp_code: string | null;
  name: string;
  name_en: string;
  sector: string;
  market: 'KOSPI' | 'KOSDAQ';
  current_price: SampleNumber;
  /** 전일 대비 등락률 (%) */
  change_rate: SampleNumber;
  /** AI 리포트가 준비된 회사인지 */
  has_report: boolean;
}

export interface BusinessSegment {
  code: string;
  name: string;
  description: string;
}

export interface TimelineItem {
  year: string;
  title: string;
  description: string;
  is_plan: boolean;
}

/** GET /api/companies/{stock_code} 응답 */
export interface CompanyDetail extends CompanySummary {
  /** 시가총액 (조 원) */
  market_cap: SampleNumber;
  homepage_url: string;
  dart_url: string;
  business_description: string;
  business_segments: BusinessSegment[];
  timeline: TimelineItem[];
  timeline_source: string;
}
