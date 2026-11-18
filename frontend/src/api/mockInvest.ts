import type { MockOrderRequest, MockOrderResult, MockPortfolio, MockTrade } from '../types';
import { request } from './client';

/** 내 모의투자 자산·보유 종목 (로그인 필요) */
export function getMockPortfolio() {
  return request<MockPortfolio>({ path: '/api/me/mock-invest' });
}

/** 내 거래 내역 (최신 순) */
export function getMockTrades() {
  return request<MockTrade[]>({ path: '/api/me/mock-invest/trades' });
}

/** 사기·팔기. 체결 가격·ADK 차감은 서버가 지연 시세로 정해요. */
export function postMockOrder(order: MockOrderRequest) {
  return request<MockOrderResult>({
    path: '/api/me/mock-invest/orders',
    method: 'POST',
    body: order,
  });
}
