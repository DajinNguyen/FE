export type PricePeriod = '1m' | '3m' | '6m' | '1y';

/** 하루(1년 보기는 한 주) 캔들. 단위는 원 */
export interface PricePoint {
  /** YYYY-MM-DD */
  date: string;
  /** 시가 */
  open: number;
  /** 고가 */
  high: number;
  /** 저가 */
  low: number;
  /** 종가 */
  close: number;
}

/** GET /api/companies/{stock_code}/prices?period= 응답 */
export interface PriceHistory {
  stock_code: string;
  period: PricePeriod;
  points: PricePoint[];
}
