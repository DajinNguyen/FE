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
  /** 이 회사를 한 문장으로 소개해요. 예: "스마트폰과 반도체를 만드는 회사예요" */
  one_liner: string;
  /** 투자경고·관리종목 같은 시장 안내. 없으면 null (화면에는 "주의" 배지) */
  market_alert: string | null;
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
  /** 시가총액 (조 원). 아직 자료가 없으면 null */
  market_cap: SampleNumber | null;
  homepage_url: string;
  dart_url: string;
  business_description: string;
  business_segments: BusinessSegment[];
  timeline: TimelineItem[];
  timeline_source: string;
}
