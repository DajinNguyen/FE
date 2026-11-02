import type { NewsItem } from './news';

/** 시장 지수 (코스피·코스닥) */
export interface MarketIndex {
  code: 'KOSPI' | 'KOSDAQ';
  /** 지수 */
  value: number;
  /** 어제 대비 등락폭 */
  change: number;
  /** 어제 대비 등락률 (%) */
  change_rate: number;
  /** 공식 시세로 바꾸기 전 예시 값이면 true → "예시 값" 배지 */
  is_sample: boolean;
  /** 당일 흐름 (작은 선 그래프). 없으면 그래프를 숨겨요. */
  intraday?: { time: string; value: number }[];
}

/** 시장이 움직인 이유 하나 */
export interface MarketReason {
  /** 이유 제목 한 줄 */
  title: string;
  /** 설명 1~2문장 */
  description: string;
  /** 관련 산업과 등락률. 칩을 누르면 산업 페이지(/industries/{industry_id})로 가요. */
  industries: { industry_id: string; name: string; change_rate: number }[];
  /** 근거 뉴스 */
  news: NewsItem[];
}

/** GET /api/market/summary 응답: 메인 "오늘의 시장" */
export interface MarketSummary {
  /** 기준 시각 (예: "2026-10-24T15:30:00+09:00") */
  as_of: string;
  /** 장 시작 전·휴장일이라 직전 거래일 자료면 true → "직전 거래일 기준" 표시 */
  is_previous_session: boolean;
  /** 오늘의 시장 한마디 (AI 가 뉴스와 지수를 바탕으로 정리) */
  headline: string;
  indices: MarketIndex[];
  reasons: MarketReason[];
}
