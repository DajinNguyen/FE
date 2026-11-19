import type { PriceInterval, PricePeriod } from '../types';

/** 개요 "주가 흐름"의 작은 그래프: 캔들 단위를 고르면 그에 맞는 기간을 보여 줘요. */
export const CANDLE_UNITS = [
  { value: 'day', label: '일', period: '3m', since: '3달 전보다' },
  { value: 'week', label: '주', period: '1y', since: '1년 전보다' },
  { value: 'month', label: '월', period: '5y', since: '5년 전보다' },
  { value: 'year', label: '년', period: 'all', since: '전체 기간' },
] as const satisfies readonly {
  value: PriceInterval;
  label: string;
  period: PricePeriod;
  since: string;
}[];

export type CandleUnit = (typeof CANDLE_UNITS)[number]['value'];

/**
 * 차트 크게 보기 (토스증권처럼): 기간을 고르면 오늘부터 딱 그 기간이 화면에 들어와요.
 * 1달은 1시간, 3달은 반나절 캔들이라 촘촘해요. 그래프를 끌면 지난 기간이 보이도록
 * 받아 오기는 더 길게(fetch) 해요.
 * - days: 처음 보여 줄 기간 (일). 1일은 가장 최근 거래일, 5일·전체는 받은 캔들 모두
 */
export const FULL_RANGES = [
  { value: '1d', label: '1일', interval: '1min', fetch: '5d', days: 1 },
  { value: '5d', label: '5일', interval: '10min', fetch: '5d', days: null },
  { value: '1m', label: '1달', interval: '60min', fetch: '6m', days: 30 },
  { value: '3m', label: '3달', interval: 'halfday', fetch: '1y', days: 91 },
  { value: '6m', label: '6달', interval: 'day', fetch: '5y', days: 182 },
  { value: '1y', label: '1년', interval: 'day', fetch: '5y', days: 365 },
  { value: '5y', label: '5년', interval: 'week', fetch: 'all', days: 1825 },
  { value: 'all', label: '전체', interval: 'month', fetch: 'all', days: null },
] as const satisfies readonly {
  value: PricePeriod;
  label: string;
  interval: PriceInterval;
  fetch: PricePeriod;
  days: number | null;
}[];

export type FullRange = (typeof FULL_RANGES)[number]['value'];
