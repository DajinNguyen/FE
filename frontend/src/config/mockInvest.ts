/**
 * 모의투자 규칙 (2026-11-18 결정, 2026-11-19 환전 추가)
 * - 앰똥깡(ADK)을 가상 현금(원)으로 환전해서 그 돈으로 사고팔아요 (1 ADK = 가상 1만 원).
 *   환전은 정수 ADK만, 되돌릴 수 없어요. 사고팔아도 앰똥깡은 그대로라 소수 ADK가 생기지 않아요.
 * - 가격: 지연 시세 (서버가 주문을 받은 때의 지연 시세로 체결해요)
 * - 초기화: 없어요.
 * 실제 체결·잔액 판단은 서버가 해요. (docs/frontend-data-requirements.md 19장)
 */
import { CURRENCY_NAME } from './currency';

/** 1 ADK = 가상 몇 원 (2026-11-18 확정) */
export const ADK_TO_WON = 10_000;

/** 한 번에 주문할 수 있는 최대 수량 ⚠️ 임시값, 확정 필요 */
export const MAX_ORDER_QUANTITY = 10_000;

export const MOCK_INVEST_PATH = '/mock-invest';

/** 모의투자 화면·카드에 붙이는 안내 */
export const MOCK_INVEST_NOTICE = `모의투자는 ${CURRENCY_NAME}(ADK)을 가상 현금으로 환전해서 하는 연습이에요. 실제 돈이 아니며, 특정 종목을 사라거나 팔라는 뜻이 아니에요`;

/** 카드에 작게 */
export const MOCK_INVEST_SHORT_NOTICE = '실제 돈이 아니에요';

/** 환전 안내 */
export const MOCK_INVEST_SHARED_ADK_TEXT = `${CURRENCY_NAME}을 가상 현금으로 환전해서 모의투자를 해요. 환전한 ${CURRENCY_NAME}은 AI 리포트·챗봇에 쓸 수 없고, 다시 ${CURRENCY_NAME}으로 바꿀 수 없어요`;

/** 가격 기준 안내 */
export const MOCK_PRICE_BASIS_TEXT =
  '지연 시세로 계산해요. 실제로 사고팔 때는 주문을 받은 때의 지연 시세로 정해져서 예상 금액과 조금 다를 수 있어요';
