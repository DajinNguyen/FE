import type { NewsSentiment } from '../types';

/**
 * 뉴스 한 건이 호재인지 악재인지 AI가 판단한 5단계 기준.
 * 실제 판단은 서버(AI)가 하고, 프론트는 라벨·색·"기준 보기" 설명에만 이 값을 써요.
 */
export const NEWS_SENTIMENT_LABELS: Record<NewsSentiment, string> = {
  very_good: '아주 좋음',
  good: '좋음',
  neutral: '보통',
  bad: '나쁨',
  very_bad: '아주 나쁨',
};

/** 라벨과 같은 순서 (좋은 쪽 → 나쁜 쪽), "기준 보기" 표에도 이 순서로 보여줘요 */
export const NEWS_SENTIMENT_ORDER: NewsSentiment[] = [
  'very_good',
  'good',
  'neutral',
  'bad',
  'very_bad',
];

/** CSS 모듈 클래스 키 (News.module.css 의 .veryGood 등과 맞춰요) */
export const NEWS_SENTIMENT_CLASS_KEY: Record<NewsSentiment, string> = {
  very_good: 'veryGood',
  good: 'good',
  neutral: 'neutral',
  bad: 'bad',
  very_bad: 'veryBad',
};

/** "기준 보기"에 보여줄 단계별 설명. NEWS_SENTIMENT_ORDER 와 같은 순서예요. */
export const NEWS_SENTIMENT_CRITERIA_TEXT: Record<NewsSentiment, string> = {
  very_good: '사상 최대 실적·이익, 대형 신규 계약·수주, 신용등급 상향 같은 소식이에요.',
  good: '실적 개선, 신사업 진출, 목표가 상향, 배당 확대 같은 소식이에요.',
  neutral:
    '인사·행사·정기 공시처럼 단순 사실만 전달하거나, 좋다 나쁘다 판단하기 애매한 소식이에요.',
  bad: '실적 부진, 소송 제기, 일부 사업 철수, 경영진 관련 가벼운 구설수 같은 소식이에요.',
  very_bad:
    '경영진의 횡령·스캔들성 해임·사임, 대규모 리콜·사고, 중대한 제재·과징금, 부도설 같은 소식이에요.',
};

/** "기준 보기" 맨 아래 안내 */
export const NEWS_SENTIMENT_DISCLAIMER =
  '이 판단은 투자 추천이 아니에요. 참고용으로만 봐 주세요. AI가 자동으로 판단한 거라 실제와 다를 수 있어요.';
