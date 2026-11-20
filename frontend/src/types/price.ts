/** 그래프 기간 (1d·5d는 마지막 1·5 거래일) */
export type PricePeriod = '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y' | 'all';

/** 캔들 하나의 길이 */
export type PriceInterval =
  '1min' | '10min' | '60min' | 'halfday' | 'day' | 'week' | 'month' | 'year';

/** 캔들 하나 (분·일·주·월·년). 단위는 원 */
export interface PricePoint {
  /** YYYY-MM-DD (주·월·년 캔들은 그 기간의 첫날) */
  date: string;
  /** 분 캔들만 "HH:MM" */
  time?: string | null;
  /** 시가 */
  open: number;
  /** 고가 */
  high: number;
  /** 저가 */
  low: number;
  /** 종가 */
  close: number;
  /** 거래량 (주). 백엔드가 아직 주지 않으면 없어요 → 거래량 막대를 숨겨요 */
  volume?: number | null;
}

/** GET /api/companies/{stock_code}/prices?period= 응답 */
export interface PriceHistory {
  stock_code: string;
  period: PricePeriod;
  /** 캔들 길이. 예전 백엔드는 주지 않아요 */
  interval?: PriceInterval;
  points: PricePoint[];
  /** 전일 종가 (원). 현재가·등락률과 같은 기준이에요. 없을 수 있어요 */
  previous_close?: number | null;
}
