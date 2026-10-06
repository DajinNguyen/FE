export type PricePeriod = '1m' | '3m' | '6m' | '1y';

export interface PricePoint {
  /** YYYY-MM-DD */
  date: string;
  /** 종가 (원) */
  close: number;
}

/** GET /api/companies/{stock_code}/prices?period= 응답 */
export interface PriceHistory {
  stock_code: string;
  period: PricePeriod;
  /** 한국거래소 실제 시세로 바꾸기 전까지는 true */
  is_sample: boolean;
  points: PricePoint[];
}
