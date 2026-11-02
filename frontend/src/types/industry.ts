import type { NewsItem } from './news';

/** 관심도 3단계. 메인 산업 아이콘 크기(크게·중간·작게)를 정해요. */
export type HeatLevel = 'high' | 'mid' | 'low';

/** 뜨는 산업을 고르는 기간 */
export type HeatPeriod = '1w' | '1m';

/** GET /api/industries/hot?period=1w 응답 항목: 메인 "지금 관심이 몰리는 산업" */
export interface IndustrySummary {
  industry_id: string;
  name: string;
  /** 아이콘 이름. 화면의 아이콘 매핑은 src/config/industryIcons.ts */
  icon_key: string;
  /** 관심도 점수 (계산 방법: src/config/industryHeat.ts) */
  heat_score: number;
  heat_level: HeatLevel;
  /** 아이콘 아래 대표 숫자. 예: { label: "최근 1주", value: 6.2, unit: "%" } → "최근 1주 +6.2%" */
  headline_metric: { label: string; value: number; unit: string };
  /** 기준 시각 (ISO 8601) */
  as_of: string;
  /** 예시 값이면 true → "예시 값" 배지 */
  is_sample?: boolean;
}

/** 산업 페이지 "관련 기업" 한 줄 (시가총액 큰 순) */
export interface IndustryCompany {
  stock_code: string;
  name: string;
  /** 한 줄 소개 */
  intro: string;
  /** 시가총액 (조 원) */
  market_cap: number;
  /** 전일 대비 등락률 (%) */
  change_rate: number;
}

/** GET /api/industries/{industry_id} 응답: 산업 페이지 */
export interface IndustryDetail {
  industry_id: string;
  name: string;
  icon_key: string;
  /** 한 줄 설명 */
  description: string;
  /** 왜 관심이 몰리고 있나요? AI 정리 2~3문장 + 근거 뉴스(news 의 id) */
  why: { text: string; news_ids: string[] };
  /** 최근 1개월 흐름 (주 단위, 1개월 전 대비 누적 등락률 %) */
  trend: { date: string; value: number }[];
  /** 점수 구성 (변화율 %, period 기간 기준) */
  score_breakdown: {
    price_change_rate: number;
    trading_value_change_rate: number;
    news_mention_change_rate: number;
    period: HeatPeriod;
  };
  /** 근거 뉴스 (why.news_ids 가 가리켜요) */
  news: NewsItem[];
  /** 관련 기업, 시가총액 큰 순 */
  companies: IndustryCompany[];
  as_of: string;
  is_sample?: boolean;
}
