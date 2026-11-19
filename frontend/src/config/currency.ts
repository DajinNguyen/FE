/**
 * 앰똥깡(ADK): 다진 안에서만 쓰는 포인트. 화면 문구는 모두 이 파일의 값으로 만들어요.
 * 실제 지급·차감 판단은 서버가 해요. (docs/frontend-data-requirements.md 16장)
 */
export const CURRENCY_NAME = '앰똥깡';
export const CURRENCY_UNIT = 'ADK';
/** 설명 문구용: "앰똥깡(ADK)" */
export const CURRENCY_LABEL = `${CURRENCY_NAME}(${CURRENCY_UNIT})`;

/** 쓰는 곳별 비용 (확정). 이미 만들어진 리포트 보기는 무료예요. */
export const ADK_COST = {
  /** AI 리포트 만들기·다시 만들기 */
  report: 7,
  /** AI 챗봇 질문 1번 (답변을 받은 뒤에만 차감) */
  chat: 5,
} as const;

/** 낱말퀴즈 보상: 정답 보기 없이 퀴즈 3개를 끝낼 때마다 20 ADK */
export const PUZZLE_REWARD = {
  /** 보상 한 번에 필요한 퀴즈 수 (확정) */
  puzzlesPerReward: 3,
  /** 보상 금액 (확정) */
  amount: 20,
  /** 하루 최대 보상 횟수 ⚠️ 임시값, 확정 필요 */
  dailyLimit: 2,
} as const;

/** 가입 선물 (서버가 가입할 때 지급) ⚠️ 임시값, 확정 필요 */
export const SIGNUP_BONUS = 50;

/**
 * 모의투자 금액처럼 소수가 생기는 ADK: 소수 둘째 자리까지 버림 ("38.55 ADK").
 * 헤더·리포트·챗봇은 formatAdk (정수)를 써요.
 */
export const formatAdkDetail = (amount: number) => {
  const floored = Math.floor(amount * 100 + 1e-9) / 100;
  return `${floored.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} ${CURRENCY_UNIT}`;
};

/** "1,240 ADK" (정수, 천 단위 쉼표) */
export const formatAdk = (amount: number) =>
  `${Math.trunc(amount).toLocaleString('ko-KR')} ${CURRENCY_UNIT}`;

/** ADK 를 보여주는 모든 화면에 붙이는 안내 */
export const ADK_NOTICE = `${CURRENCY_NAME}은 다진 안에서만 쓰는 포인트예요. 실제 돈이 아니며 실제 돈으로 사거나 바꿀 수 없어요`;

/** 잔액이 부족할 때 */
export const ADK_SHORTAGE_TEXT = `${CURRENCY_NAME}이 부족해요. 낱말퀴즈 ${PUZZLE_REWARD.puzzlesPerReward}개를 풀면 ${formatAdk(PUZZLE_REWARD.amount)}를 받을 수 있어요`;

/** 학습 화면·메인 안내 */
export const PUZZLE_REWARD_TEXT = `낱말퀴즈 ${PUZZLE_REWARD.puzzlesPerReward}개를 풀면 ${formatAdk(PUZZLE_REWARD.amount)}`;

/** 비로그인으로 ADK 기능을 누르면 뜨는 로그인 시트 제목 */
export const SIGNUP_GIFT_TEXT = `Google로 로그인하면 가입 선물로 ${formatAdk(SIGNUP_BONUS)}를 드려요`;
