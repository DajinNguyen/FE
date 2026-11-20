/**
 * 모의투자 (지연 시세, 초기화 없음). 금액은 모두 가상 원이에요.
 * 앰똥깡을 가상 현금으로 환전해서(1 ADK = ADK_TO_WON 원) 그 돈으로 매수·매도해요.
 * 가상 현금 = 환전한 돈 + 판 돈 − 산 돈
 */

/** 보유 종목 하나 */
export interface MockHolding {
  stock_code: string;
  name: string;
  quantity: number;
  /** 평균 산 가격 (원) */
  avg_price: number;
  /** 지금 가격 (지연 시세, 원) */
  current_price: number;
  /** 오늘 등락률 (%) — 오늘 변화 계산용 */
  change_rate: number;
  /** 평가금액 = current_price × quantity */
  evaluation: number;
  /** 평가손익 = evaluation − avg_price × quantity */
  profit: number;
  /** 수익률 (%) */
  profit_rate: number;
}

/** GET /api/me/mock-invest */
export interface MockPortfolio {
  /** 한 번이라도 환전하거나 사고판 적이 있는지 (메인 카드 "시작 안 함" 구분) */
  started: boolean;
  /** 1 ADK = 가상 몇 원 (환전 비율, 서버 기준) */
  adk_to_won: number;
  /** 환전할 수 있는 앰똥깡 잔액 (지갑 잔액과 같아요) */
  adk_balance: number;
  /** 가상 현금 (원) = 환전한 돈 + 판 돈 − 산 돈 */
  cash: number;
  /** 평가금액 합 (원) */
  evaluation: number;
  /** 총 자산 = cash + evaluation (원) */
  total_asset: number;
  /** 평가손익 합 (원) */
  profit: number;
  /** 보유 종목 수익률 (%). 보유 종목이 없으면 null */
  profit_rate: number | null;
  /** 보유 종목의 오늘 평가금액 변화 (원) */
  today_change: number;
  /** 지연 시세 기준 시각 ("2026-11-18 10:20") */
  price_as_of: string | null;
  holdings: MockHolding[];
}

export type MockOrderSide = 'buy' | 'sell';

/** POST /api/me/mock-invest/orders 요청 */
export interface MockOrderRequest {
  stock_code: string;
  side: MockOrderSide;
  quantity: number;
}

/** 거래 하나 (GET /api/me/mock-invest/trades, 최신 순) */
export interface MockTrade {
  id: string;
  stock_code: string;
  name: string;
  side: MockOrderSide;
  quantity: number;
  /** 체결 가격 (지연 시세, 원) */
  price: number;
  /** 체결 금액 = price × quantity (원) */
  amount: number;
  /** 환전 기능 전 거래만: 빠지거나 돌아온 ADK. 가상 현금으로 매수·매도했으면 0 */
  amount_adk: number;
  /** ISO 시각 */
  created_at: string;
}

/** POST /api/me/mock-invest/exchange 응답의 환전 한 건 */
export interface MockExchange {
  id: string;
  /** 빠진 앰똥깡 (정수) */
  adk: number;
  /** 들어온 가상 현금 (원) */
  won: number;
  created_at: string;
}

/** POST /api/me/mock-invest/exchange 응답 */
export interface MockExchangeResult {
  exchange: MockExchange;
  /** 환전 뒤 앰똥깡 잔액 */
  balance: number;
  portfolio: MockPortfolio;
}

/** POST /api/me/mock-invest/orders 응답 */
export interface MockOrderResult {
  trade: MockTrade;
  /** 주문 뒤 앰똥깡 잔액 */
  balance: number;
  portfolio: MockPortfolio;
}
