/**
 * 모의투자 규칙 (2026-11-18 결정: D-0)
 * - 1안 ADK 단일: 모의투자도 앰똥깡(ADK)으로 해요. 사면 ADK 가 빠지고, 팔면 돌아와요.
 *   그래서 모의투자에서 잃으면 AI 리포트·챗봇에 쓸 ADK 도 줄어들어요.
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

/** 원 → ADK (소수 넷째 자리 = 1원까지) */
export const wonToAdk = (won: number) => Math.round((won / ADK_TO_WON) * 10_000) / 10_000;

/** 모의투자 화면·카드에 붙이는 안내 */
export const MOCK_INVEST_NOTICE = `모의투자는 ${CURRENCY_NAME}(ADK)으로 하는 연습이에요. 실제 돈이 아니며, 특정 종목을 사라거나 팔라는 뜻이 아니에요`;

/** 카드에 작게 */
export const MOCK_INVEST_SHORT_NOTICE = '실제 돈이 아니에요';

/** ADK 를 함께 쓴다는 안내 (1안) */
export const MOCK_INVEST_SHARED_ADK_TEXT = `모의투자에 쓴 ${CURRENCY_NAME}은 AI 리포트·챗봇에 쓰는 것과 같은 ${CURRENCY_NAME}이에요. 모의투자에서 줄어들면 리포트·챗봇에 쓸 수 있는 양도 줄어요`;

/** 가격 기준 안내 */
export const MOCK_PRICE_BASIS_TEXT =
  '지연 시세로 계산해요. 실제로 사고팔 때는 주문을 받은 때의 지연 시세로 정해져서 예상 금액과 조금 다를 수 있어요';
