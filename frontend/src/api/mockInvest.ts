import type {
  MockExchangeResult,
  MockOrderRequest,
  MockOrderResult,
  MockPortfolio,
  MockTrade,
} from '../types';
import { request } from './client';

/** 내 모의투자 자산·보유 종목 (로그인 필요) */
export function getMockPortfolio() {
  return request<MockPortfolio>({ path: '/api/me/mock-invest' });
}

/** 내 거래 내역 (최신 순) */
export function getMockTrades() {
  return request<MockTrade[]>({ path: '/api/me/mock-invest/trades' });
}

/** 매수·매도. 체결 가격은 서버가 지연 시세로 정하고, 가상 현금으로 계산해요. */
export function postMockOrder(order: MockOrderRequest) {
  return request<MockOrderResult>({
    path: '/api/me/mock-invest/orders',
    method: 'POST',
    body: order,
  });
}

/** 앰똥깡 → 가상 현금 환전 (정수 ADK, 1 ADK = 가상 1만 원). 되돌릴 수 없어요. */
export function postMockExchange(adk: number) {
  return request<MockExchangeResult>({
    path: '/api/me/mock-invest/exchange',
    method: 'POST',
    body: { adk },
  });
}
