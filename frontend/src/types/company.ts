import type { SampleNumber } from './common';

/**
 * 업종 묶음. (메인 업종 탭은 산업 아이콘으로 바뀌어서 지금 화면에서는 쓰지 않아요)
 * 어느 묶음에도 들지 않으면 "etc" 예요.
 */
export type SectorGroup = 'semiconductor' | 'auto' | 'internet' | 'finance' | 'food' | 'etc';

/** GET /api/companies?query= , /api/companies/popular 응답 항목 */
export interface CompanySummary {
  stock_code: string;
  corp_code: string | null;
  name: string;
  name_en: string;
  sector: string;
  /** 업종 탭 묶음 (sector 는 화면에 그대로 보여주는 자세한 업종 이름) */
  sector_group: SectorGroup;
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
  /** 이 회사가 속한 산업 (칩을 누르면 산업 페이지). 없으면 빈 배열 */
  industries: { industry_id: string; name: string }[];
  homepage_url: string;
  dart_url: string;
  business_description: string;
  business_segments: BusinessSegment[];
  timeline: TimelineItem[];
  timeline_source: string;
  /** 현재가·등락률의 기준일 (YYYY-MM-DD, 보통 직전 거래일). 없으면 기준일 표시를 숨겨요. */
  price_as_of: string | null;
}
