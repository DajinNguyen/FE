import type { HeatPeriod } from '../types';

/**
 * "지금 관심이 몰리는 산업" 고르는 기준.
 * ⚠️ 임시값, 확정 필요 (PM·클라이언트). 기준이 바뀌면 이 파일만 고치면 돼요.
 * 실제 계산은 서버가 하고, 프론트는 이 값을 "기준 보기"와 산업 페이지 설명에 써요.
 */
export const HEAT_PERIODS: { id: HeatPeriod; label: string }[] = [
  { id: '1w', label: '최근 1주' },
  { id: '1m', label: '최근 1개월' },
];

/** 처음 보여줄 기간 */
export const DEFAULT_HEAT_PERIOD: HeatPeriod = '1w';

/**
 * 점수 = 주가 상승률 35% + 거래대금 증가율 30% + 뉴스 언급 증가율 25% + 커뮤니티 활발도 10%
 * ⚠️ 임시값, 확정 필요. 커뮤니티 활발도 = 그 산업 기업들의 최근 1주 게시글·댓글 수 증가율 (계산은 서버)
 */
export const HEAT_WEIGHTS = {
  price_change_rate: 0.35,
  trading_value_change_rate: 0.3,
  news_mention_change_rate: 0.25,
  community_activity_change_rate: 0.1,
} as const;

/** 메인에 보여줄 산업 개수: 점수 상위 3개만 */
export const HOT_INDUSTRY_LIMIT = 3;

export const HEAT_FACTOR_LABELS = {
  price_change_rate: '주가 상승률',
  trading_value_change_rate: '거래대금 증가율',
  news_mention_change_rate: '뉴스 언급 증가율',
  community_activity_change_rate: '커뮤니티 활발도',
} as const;

/** "기준 보기"와 산업 페이지에 같이 쓰는 설명 문장 */
export const HEAT_CRITERIA_TEXT = [
  '고른 기간(최근 1주 또는 1개월) 동안의 변화를 봐요.',
  '점수 = 주가 상승률 35% + 거래대금 증가율 30% + 뉴스 언급 증가율 25% + 커뮤니티 활발도 10%',
  '커뮤니티 활발도는 그 산업 기업들의 최근 1주 게시글·댓글 수가 얼마나 늘었는지예요.',
  '점수가 높은 순서로 상위 3개만 보여줘요. 1위일수록 아이콘이 커요.',
];

/** "기준 보기"와 산업 페이지 맨 아래 안내 */
export const HEAT_DISCLAIMER =
  '관심이 몰린다는 것은 투자 추천이 아니에요. 왜 관심을 받는지 알아보는 데 써 주세요.';

/** 점수 구성 칸 이름 (표 순서) */
export const HEAT_FACTORS = Object.keys(HEAT_WEIGHTS) as (keyof typeof HEAT_WEIGHTS)[];
